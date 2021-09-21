
import * as algob from '@algo-builder/algob';
import { LogicSig } from '@algo-builder/runtime';

import config from '../../config';
import { getBuyGroup, getCreateAuctionTxGroup, getCreateSellTxGroup, getReedemAndCloseEscrowGroup } from '../../test/utils/protocolGroupsTx';
import { getAssetTransferTxn } from '../../test/utils/protocolTxn';
import { createEscrow, fundAccounts } from './utils';

const price = 1;

async function run (
  runtimeEnv: algob.types.RuntimeEnv,
  deployer: algob.types.Deployer
): Promise<void> {
  const tempAccount = deployer.accountsByName.get('temp');
  const aliceAccount = deployer.accountsByName.get('alice');
  const bobAccount = deployer.accountsByName.get('bob');

  if (!tempAccount || !aliceAccount || !bobAccount) {
    throw new Error('Missing accounts');
  }
  // await fundAccounts(deployer, tempAccount, [aliceAccount], 10e6);

  const assets = [];

  for (let x = 0; x < 10; x++) {
    assets.push(deployer.getASAInfo(`TEST${x}`).assetIndex
    );
  }
  const cosmos = deployer.getApp('cosmos_approval.py', 'cosmos_clear_state.py');

  if (!cosmos) {
    throw new Error('Missing App');
  }

  await deployer.optInAccountToApp(aliceAccount, cosmos?.appID, { totalFee: config.fee }, {});

  const escrows = [];

  for (let y = 0; y < assets.length; y++) {
    const moveNFT = getAssetTransferTxn(tempAccount, aliceAccount.addr, assets[y], 1, config.fee);
    await algob.executeTransaction(deployer, moveNFT);
  }

  for (let z = 0; z < assets.length / 2; z++) {
    const escrow = await deployer.loadLogic('escrow.py', {
      ASSET_ID: BigInt(assets[z]),
      APP_ID: BigInt(cosmos.appID),
      USER_ADDRESS: aliceAccount.addr
    });
    await createEscrow(deployer, aliceAccount, escrow.address(), config.escrowBalance);

    const createSellGroup = getCreateSellTxGroup(cosmos.appID, <LogicSig>escrow, aliceAccount, config.fee, assets[z], price);

    await algob.executeTransaction(deployer, createSellGroup);

    escrows.push(escrow);
  }

  for (let z = assets.length / 2; z < assets.length; z++) {
    const escrow = await deployer.loadLogic('escrow.py', {
      ASSET_ID: BigInt(assets[z]),
      APP_ID: BigInt(cosmos.appID),
      USER_ADDRESS: aliceAccount.addr
    });
    await createEscrow(deployer, aliceAccount, escrow.address(), config.escrowBalance);

    const createSellGroup = getCreateAuctionTxGroup(cosmos.appID, <LogicSig>escrow, aliceAccount, config.fee, assets[z], price, 100000000);

    await algob.executeTransaction(deployer, createSellGroup);
    escrows.push(escrow);
  }

  console.log(escrows.map(escrow => escrow.address()));
  //   const buyGroup = getBuyGroup(cosmos.appID, <LogicSig>escrow, bobAccount, config.fee, nftID, price);

  //   await algob.executeTransaction(deployer, buyGroup);

  //   const reedemAndCloseEscrowGroup = getReedemAndCloseEscrowGroup(cosmos.appID, <LogicSig>escrow, aliceAccount, config.fee, nftID, price);

//   await algob.executeTransaction(deployer, reedemAndCloseEscrowGroup);
}

module.exports = { default: run };
