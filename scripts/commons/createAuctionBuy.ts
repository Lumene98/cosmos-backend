import * as algob from '@algo-builder/algob';
import { LogicSig } from '@algo-builder/runtime';
import { Transaction } from 'algosdk';

import { TransactionType } from '../../algo-builder/packages/web/build/types';
import config from '../../config';
import { getBuyGroup, getCreateAuctionTxGroup, getOfferAutionGroup } from '../../test/utils/protocolGroupsTx';
import { getAssetTransferTxn } from '../../test/utils/protocolTxn';
import { createEscrow } from './utils';

async function run (
  runtimeEnv: algob.types.RuntimeEnv,
  deployer: algob.types.Deployer
): Promise<void> {
  const masterAccount = deployer.accountsByName.get('master-account');
  const aliceAccount = deployer.accountsByName.get('alice');
  const bobAccount = deployer.accountsByName.get('bob');
  const tempAccount = deployer.accountsByName.get('temp');

  if (!masterAccount || !aliceAccount || !bobAccount || !tempAccount) {
    throw new Error('Missing accounts');
  }

  const cosmos = deployer.getApp('cosmos_approval.py', 'cosmos_clear_state.py');

  if (!cosmos) {
    throw new Error('Missing App');
  }

  const asset = (await deployer.deployASADef(`TEST${11}`, {
    total: 1,
    decimals: 0,
    defaultFrozen: false,
    unitName: "PLANET",
    url: "url",
    metadataHash: "12312442142141241244444411111133",
    note: "note",
    noteb64: "noteb64",
    manager: "",
    reserve: tempAccount.addr,
    freeze: "",
    clawback: ""
  }, { creator: tempAccount })).assetIndex;

  await deployer.optInAcountToASA(`TEST${11}`, aliceAccount.name, { totalFee: 1000 });
  await deployer.optInAcountToASA(`TEST${11}`, bobAccount.name, { totalFee: 1000 });

  const moveNFT = getAssetTransferTxn(tempAccount, aliceAccount.addr, asset, 1, config.fee);
  await algob.executeTransaction(deployer, moveNFT);

  const escrow = await deployer.loadLogic('escrow.py', {
    ASSET_ID: BigInt(asset),
    APP_ID: BigInt(cosmos.appID),
    USER_ADDRESS: aliceAccount.addr
  });
  await createEscrow(deployer, aliceAccount, escrow.address(), config.escrowBalance);

  const createSellGroup = getCreateAuctionTxGroup(cosmos.appID, <LogicSig>escrow, aliceAccount, config.fee, asset, 1, 16386140);

  await algob.executeTransaction(deployer, createSellGroup);

  const offerAuctionGroup = getOfferAutionGroup(cosmos.appID, <LogicSig>escrow, bobAccount, config.fee, 1 + 1, asset);

  await algob.executeTransaction(deployer, offerAuctionGroup);

  //   const buyGroup = getBuyGroup(cosmos.appID, <LogicSig>escrow, bobAccount, config.fee, asset, 1 + 1);

//   await algob.executeTransaction(deployer, buyGroup);
}

module.exports = { default: run };
