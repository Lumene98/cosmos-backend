import * as algob from '@algo-builder/algob';

import config from '../config';
import { deployCosmosApp, fundAccounts } from './commons/utils';

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

  await fundAccounts(deployer, masterAccount, [aliceAccount, bobAccount], config.initialAccountBalance);
  await fundAccounts(deployer, masterAccount, [tempAccount], 20e6);

  const assets = [];

  for (let x = 0; x < 10; x++) {
    assets.push((await deployer.deployASADef(`TEST${x}`, {
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
    }, { creator: tempAccount })).assetIndex);
  }

  for (let y = 0; y < assets.length; y++) {
    await deployer.optInAcountToASA(`TEST${y}`, aliceAccount.name, { totalFee: 1000 });
    await deployer.optInAcountToASA(`TEST${y}`, bobAccount.name, { totalFee: 1000 });
  }

  const flags = {
    sender: tempAccount,
    localInts: 4,
    localBytes: 2,
    globalInts: 1,
    globalBytes: 1,
    appArgs: []
  };

  const cosmos = await deployCosmosApp(deployer, [], flags);

  if (!cosmos) {
    throw new Error('Missing main app');
  }
}

module.exports = { default: run };
