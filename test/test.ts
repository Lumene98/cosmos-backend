import { getProgram } from '@algo-builder/algob';
import { AccountStore, LogicSig, Runtime } from '@algo-builder/runtime';
import { RUNTIME_ERROR_PREFIX } from '@algo-builder/runtime/build/errors/errors-list';
import { types as wtypes } from '@algo-builder/web';
import { decodeAddress } from 'algosdk';
import { assert } from 'chai';

import { rtypes } from '../algo-builder/packages/algob/build/runtime';
import config from '../config';
import { getBuyGroup, getCreateAuctionTxGroup, getCreateSellTxGroup, getOfferAutionGroup, getReedemAndCloseEscrowGroup } from './utils/protocolGroupsTx';
import { getAssetTransferTxn, getOptIntoAssetTxn } from './utils/protocolTxn';
import { setupEscrow, StateUtil } from './utils/utils';

const approvalProg = getProgram('cosmos_approval.py');
const clearProg = getProgram('cosmos_clear_state.py');

describe('COSMOS', function () {
  let master = new AccountStore(config.masterBalance, { addr: config.masterAddr, sk: new Uint8Array(0) });
  let alice = new AccountStore(config.initialAccountBalance, { addr: config.aliceAddr, sk: new Uint8Array(0) });
  let bob = new AccountStore(config.initialAccountBalance);
  let runtime = new Runtime([master, alice, bob]);

  let creationFlags: wtypes.AppDeploymentFlags;
  let appId: number;
  let asset: number;
  let escrow: LogicSig;
  let stateUtil: StateUtil;

  // fetch latest account state
  function syncAccounts (): void {
    master = runtime.getAccount(master.address);
    alice = runtime.getAccount(alice.address);
  }

  this.beforeAll(() => {
    creationFlags = {
      sender: master.account,
      localInts: 4,
      localBytes: 2,
      globalInts: 1,
      globalBytes: 1,
      appArgs: []
    };
  });

  beforeEach(() => {
    // refresh accounts + initialize runtime
    master = new AccountStore(config.masterBalance, { addr: config.masterAddr, sk: new Uint8Array(0) });
    alice = new AccountStore(config.initialAccountBalance, { addr: config.aliceAddr, sk: new Uint8Array(0) });
    bob = new AccountStore(config.initialAccountBalance);
    runtime = new Runtime([master, alice, bob]);

    // create application
    appId = runtime.addApp(creationFlags, {}, approvalProg, clearProg);
    stateUtil = new StateUtil(appId, runtime);

    // create assets
    asset = runtime.addAsset('PLANET', { creator: { ...master.account, name: 'master' } });
  });

  it('can deploy application', () => {
    assert.isDefined(appId);
    assert.deepEqual(stateUtil.getGlobal('total_value_exchanged'), 0n); // TODO: Delete when price oracle set up
  });

  it('test sell', () => {
    let accountBalance = Number(alice.balance());
    let feePaid = 0;
    runtime.executeTx(getOptIntoAssetTxn(alice.account, asset, config.fee));
    feePaid += config.fee;
    runtime.executeTx(getAssetTransferTxn(master.account, alice.address, asset, 1, config.fee));

    escrow = setupEscrow(runtime, 'escrow.py', asset, appId, alice, config.escrowBalance, config.fee);
    accountBalance -= config.escrowBalance;
    feePaid += config.fee;
    const price = 1e6;
    runtime.executeTx(getCreateSellTxGroup(appId, escrow, <rtypes.Account>alice.account, config.fee, asset, price));
    feePaid += 4 * config.fee;

    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'user_address'), decodeAddress(alice.address).publicKey);
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'price'), BigInt(price));
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'assetID'), BigInt(asset));
    assert.deepEqual(runtime.getAccount(escrow.address()).amount, BigInt(config.escrowBalance));
    runtime.executeTx(getOptIntoAssetTxn(bob.account, asset, config.fee));
    runtime.executeTx(getBuyGroup(appId, escrow, <rtypes.Account>bob.account, config.fee, asset, price));
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'user_address'), decodeAddress(alice.address).publicKey);
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'assetID'), BigInt(asset));
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'sold'), BigInt(1));
    assert.deepEqual(runtime.getAccount(escrow.address()).amount, BigInt(config.escrowBalance + price));
    runtime.executeTx(getReedemAndCloseEscrowGroup(appId, escrow, <rtypes.Account>alice.account, config.fee, asset));
    feePaid += 4 * config.fee;
    syncAccounts();
    const expectedBalance = accountBalance + config.escrowBalance - feePaid + price;
    assert.deepEqual(Number(alice.balance()), expectedBalance);
  });

  it('test auction', () => {
    const endRound = runtime.getRound() + 1000;
    let accountBalance = Number(alice.balance());
    let feePaid = 0;
    runtime.executeTx(getOptIntoAssetTxn(alice.account, asset, config.fee));
    feePaid += config.fee;
    runtime.executeTx(getAssetTransferTxn(master.account, alice.address, asset, 1, config.fee));
    runtime.executeTx(getOptIntoAssetTxn(bob.account, asset, config.fee));

    escrow = setupEscrow(runtime, 'escrow.py', asset, appId, alice, config.escrowBalance, config.fee);
    accountBalance -= config.escrowBalance;
    feePaid += config.fee;
    const price = 1e6;
    runtime.executeTx(getCreateAuctionTxGroup(appId, escrow, <rtypes.Account>alice.account, config.fee, asset, price - 2000, endRound));
    feePaid += 4 * config.fee;
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'price'), BigInt(price - 2000));
    runtime.executeTx(getOfferAutionGroup(appId, escrow, <rtypes.Account>master.account, config.fee, price - 1000, asset));
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'offering_address'), decodeAddress(master.address).publicKey);
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'price'), BigInt(price - 1000));
    runtime.executeTx(getOfferAutionGroup(appId, escrow, <rtypes.Account>bob.account, config.fee, price, asset));
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'offering_address'), decodeAddress(bob.address).publicKey);
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'price'), BigInt(price));
    assert.throws(() => runtime.executeTx(getBuyGroup(appId, escrow, <rtypes.Account>bob.account, config.fee, asset, price)));
    runtime.setRoundAndTimestamp(endRound + 1, 1);
    assert.throws(() => runtime.executeTx(getOfferAutionGroup(appId, escrow, <rtypes.Account>bob.account, config.fee, price + 1000, asset)));
    assert.throws(() => runtime.executeTx(getBuyGroup(appId, escrow, <rtypes.Account>master.account, config.fee, asset, price)));

    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'user_address'), decodeAddress(alice.address).publicKey);
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'price'), BigInt(price));
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'assetID'), BigInt(asset));
    assert.deepEqual(runtime.getAccount(escrow.address()).amount, BigInt(config.escrowBalance));

    runtime.executeTx(getBuyGroup(appId, escrow, <rtypes.Account>bob.account, config.fee, asset, price));
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'user_address'), decodeAddress(alice.address).publicKey);
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'assetID'), BigInt(asset));
    assert.deepEqual(stateUtil.getLocal(escrow.address(), 'sold'), BigInt(1));
    assert.deepEqual(runtime.getAccount(escrow.address()).amount, BigInt(config.escrowBalance + price));
    runtime.executeTx(getReedemAndCloseEscrowGroup(appId, escrow, <rtypes.Account>alice.account, config.fee, asset));
    feePaid += 4 * config.fee;
    syncAccounts();
    const expectedBalance = accountBalance + config.escrowBalance - feePaid + price;
    assert.deepEqual(Number(alice.balance()), expectedBalance);
  });
});
