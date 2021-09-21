import * as algob from '@algo-builder/algob';
import { types as rtypes } from '@algo-builder/runtime';
import { types as wtypes } from '@algo-builder/web';
import { mnemonicToSecretKey } from 'algosdk';

export async function deployNFT (deployer: algob.types.Deployer, account: rtypes.Account, name: string): Promise<rtypes.ASAInfo> {
  return await deployer.deployASA(name, { creator: account });
}

export async function readGlobalState (deployer: algob.types.Deployer, creator: rtypes.Account, ssc: rtypes.SSCInfo): Promise<{ [x: string]: string | number | BigInt }> {
  try {
    if (!ssc) {
      throw new Error("SSC missing");
    }
    const globalState = await algob.readGlobalStateSSC(deployer, creator.addr, ssc.appID);
    if (!globalState) {
      throw new Error("GlobalState undefined");
    }

    const globalStateResults = <{ [x: string]: string | number | BigInt }>{};
    let key;
    for (const l of globalState) {
      // @ts-expect-error
      key = Buffer.from(l.key, 'base64').toString();
      // @ts-expect-error
      switch (l.value.type) {
        case 1:
          // @ts-expect-error
          globalStateResults[key] = Buffer.from(l.value.bytes, 'base64').toString();
          break;
        case 2:
          // @ts-expect-error
          globalStateResults[key] = l.value.uint;
          break;
      }
    }
    return globalStateResults;
  } catch (e) {
    console.error('Error in readGlobalState: ', e);
    return {};
  }
}

export async function readLocalState (deployer: algob.types.Deployer, account: rtypes.Account, ssc: rtypes.SSCInfo): Promise<{ [x: string]: string | number | BigInt }> {
  try {
    if (!ssc) {
      throw new Error("SSC missing");
    }
    const globalState = await algob.readLocalStateSSC(deployer, account.addr, ssc.appID);
    if (!globalState) {
      throw new Error("GlobalState undefined");
    }

    const localStateResults = <{ [x: string]: string | number | BigInt }>{};
    let key;
    for (const l of globalState) {
      // @ts-expect-error
      key = Buffer.from(l.key, 'base64').toString();
      // @ts-expect-error
      switch (l.value.type) {
        case 1:
          // @ts-expect-error
          localStateResults[key] = Buffer.from(l.value.bytes, 'base64').toString();
          break;
        case 2:
          // @ts-expect-error
          localStateResults[key] = l.value.uint;
          break;
      }
    }
    return localStateResults;
  } catch (e) {
    console.error('Error in readGlobalState: ', e);
    return {};
  }
}

export async function fundAccounts (deployer: algob.types.Deployer, funder: rtypes.Account, accountsToBeFund: rtypes.Account[], amount: number): Promise<Boolean> {
  try {
    const txs = <wtypes.AlgoTransferParam[]>[];
    accountsToBeFund.forEach(account => {
      txs.push({
        type: wtypes.TransactionType.TransferAlgo,
        sign: wtypes.SignType.SecretKey,
        fromAccount: funder,
        toAccountAddr: account.addr,
        amountMicroAlgos: amount, // 10 Algos
        payFlags: { note: 'funding account' }
      });
    });
    accountsToBeFund.map(account => console.log("Funding ", account.name));
    await algob.executeTransaction(deployer, txs);
    return true;
  } catch (e) {
    console.log("Errore during funding: ", e);
    return false;
  }
}

export async function optInAsaWithLsig (deployer: algob.types.Deployer, account: rtypes.Account, asaName: string, logicSig: any): Promise<boolean> {
  try {
    if (!account.name) {
      throw new Error('Account name missing');
    }
    await deployer.optInLsigToASA(asaName, logicSig, {});
    return true;
  } catch (e) {
    console.error('Error in optInApplication: ', e);
    return false;
  }
}

export async function checkAssetBalance (deployer: algob.types.Deployer, account: rtypes.Account, asaName: string): Promise<number | BigInt | undefined> {
  try {
    const assetId = deployer.asa.get(asaName)?.assetIndex;
    if (!assetId) {
      throw new Error("Asset missing");
    }
    return (await algob.balanceOf(deployer, account.addr, assetId))?.amount;
  } catch (e) {
    console.error('Error in checkAlendBalance: ', e);
    return undefined;
  }
};

export async function getAccount (mnemonic: string, name: string): Promise<rtypes.Account | undefined> {
  try {
    return { name, ...mnemonicToSecretKey(mnemonic) };
  } catch (e) {
    console.error('Error in getAccount: ', e);
    return undefined;
  }
}

export async function deployCosmosApp (deployer: algob.types.Deployer, creationArgs: string[], flags: wtypes.AppDeploymentFlags): Promise<rtypes.SSCInfo | undefined> {
  return await deployer.deployApp('cosmos_approval.py', 'cosmos_clear_state.py', { appArgs: creationArgs, ...flags }, { totalFee: 1000 });
}

export async function createEscrow (deployer: algob.types.Deployer, funder: rtypes.Account, accountsToBeFund: string, amount: number): Promise<Boolean> {
  try {
    await algob.executeTransaction(deployer, {
      type: wtypes.TransactionType.TransferAlgo,
      sign: wtypes.SignType.SecretKey,
      fromAccount: funder,
      toAccountAddr: accountsToBeFund,
      amountMicroAlgos: amount, // 10 Algos
      payFlags: { note: 'funding account', totalFee: 1000 }
    });

    return true;
  } catch (e) {
    console.log("Errore during funding: ", e);
    return false;
  }
}
