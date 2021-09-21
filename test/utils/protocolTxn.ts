import { LogicSig } from "@algo-builder/runtime";
import { types as wtypes } from "@algo-builder/web";
import { Account } from "algosdk";

export function getPaymentTxn (
  fromAccount: Account,
  toAccount: string,
  amount: number,
  fee: number
): wtypes.AlgoTransferParam {
  return {
    type: wtypes.TransactionType.TransferAlgo,
    sign: wtypes.SignType.SecretKey,
    fromAccount: fromAccount,
    toAccountAddr: toAccount,
    amountMicroAlgos: amount,
    payFlags: { totalFee: fee }
  };
}

export function getAssetTransferTxn (
  fromAccount: Account,
  toAccount: string,
  assetID: number,
  amount: number,
  fee: number
): wtypes.AssetTransferParam {
  return {
    type: wtypes.TransactionType.TransferAsset,
    sign: wtypes.SignType.SecretKey,
    fromAccount: fromAccount,
    toAccountAddr: toAccount,
    amount: amount,
    assetID: assetID,
    payFlags: { totalFee: fee }
  };
}

export function getOptIntoAppTxn (
  fromAccount: Account,
  appId: number,
  appArgs: any[],
  fee: number
): wtypes.AppCallsParam {
  return {
    type: wtypes.TransactionType.OptInToApp,
    sign: wtypes.SignType.SecretKey,
    fromAccount: fromAccount,
    appID: appId,
    appArgs: appArgs,
    payFlags: { totalFee: fee }
  };
}

export function getCallAppTxn (
  fromAccount: Account,
  appId: number,
  appArgs: any[],
  fee: number,
  accounts: string[],
  assetID: number
): wtypes.AppCallsParam {
  return {
    type: wtypes.TransactionType.CallNoOpSSC,
    sign: wtypes.SignType.SecretKey,
    fromAccount: fromAccount,
    appID: appId,
    appArgs: appArgs,
    accounts,
    foreignAssets: [assetID],
    payFlags: { totalFee: fee }
  };
}

export function getCallAppCloseToWithLogicSig (
  fromAccount: LogicSig,
  appId: number,
  appArgs: any[],
  fee: number,
  assetID: number
): wtypes.AppCallsParam {
  return {
    type: wtypes.TransactionType.CloseApp,
    sign: wtypes.SignType.LogicSignature,
    fromAccountAddr: fromAccount.address(),
    appID: appId,
    appArgs: appArgs,
    lsig: fromAccount,
    foreignAssets: [assetID],
    payFlags: { totalFee: fee }
  };
}

export function getPaymentTxnWithLsig (
  fromAccount: any,
  toAccount: string,
  amount: number,
  fee: number,
  closeTo?: string
): wtypes.AlgoTransferParam {
  if (!closeTo) {
    return {
      type: wtypes.TransactionType.TransferAlgo,
      sign: wtypes.SignType.LogicSignature,
      fromAccountAddr: fromAccount.address(),
      toAccountAddr: toAccount,
      amountMicroAlgos: amount,
      lsig: fromAccount,
      payFlags: { totalFee: fee }
    };
  } else {
    return {
      type: wtypes.TransactionType.TransferAlgo,
      sign: wtypes.SignType.LogicSignature,
      fromAccountAddr: fromAccount.address(),
      toAccountAddr: toAccount,
      amountMicroAlgos: amount,
      lsig: fromAccount,
      payFlags: {
        totalFee: fee,
        closeRemainderTo: closeTo
      }
    };
  }
}

export function getAssetTransferTxnWithLsig (
  fromAccount: LogicSig,
  toAccount: string,
  assetID: number,
  amount: number,
  fee: number
): wtypes.AssetTransferParam {
  return {
    type: wtypes.TransactionType.TransferAsset,
    sign: wtypes.SignType.LogicSignature,
    fromAccountAddr: fromAccount.address(),
    toAccountAddr: toAccount,
    assetID: assetID,
    amount: amount,
    lsig: fromAccount,
    payFlags: { totalFee: fee }
  };
}

export function getAssetCloseTxnWithLsig (
  fromAccount: LogicSig,
  toAccount: string,
  assetID: number,
  amount: number,
  fee: number
): wtypes.AssetTransferParam {
  return {
    type: wtypes.TransactionType.TransferAsset,
    sign: wtypes.SignType.LogicSignature,
    fromAccountAddr: fromAccount.address(),
    toAccountAddr: toAccount,
    assetID: assetID,
    amount: amount,
    lsig: fromAccount,
    payFlags: { totalFee: fee, closeRemainderTo: fromAccount.address() }
  };
}

export function getOptIntoAppTxnWithLogicSig (
  fromAccount: string,
  appId: number,
  appArgs: any[],
  lsig: any,
  fee: number
): wtypes.AppCallsParam {
  return {
    type: wtypes.TransactionType.OptInToApp,
    sign: wtypes.SignType.LogicSignature,
    fromAccountAddr: fromAccount,
    appID: appId,
    appArgs: appArgs,
    lsig,
    payFlags: { totalFee: fee }
  };
}

export function getCallAppWithLogicSigTxn (
  fromAccount: string,
  appId: number,
  appArgs: any[],
  lsig: any,
  fee: number
): wtypes.AppCallsParam {
  return {
    type: wtypes.TransactionType.CallNoOpSSC,
    sign: wtypes.SignType.LogicSignature,
    fromAccountAddr: fromAccount,
    appID: appId,
    appArgs: appArgs,
    lsig,
    payFlags: { totalFee: fee }
  };
}

export function getOptIntoAssetTxnFromLogicSig (
  fromAccount: string,
  assetID: number,
  lsig: any,
  fee: number
): wtypes.OptInASAParam {
  return {
    type: wtypes.TransactionType.OptInASA,
    sign: wtypes.SignType.LogicSignature,
    fromAccountAddr: fromAccount,
    assetID,
    lsig,
    payFlags: { totalFee: fee }
  };
}

export function getOptIntoAssetTxn (
  fromAccount: Account,
  assetID: number,
  fee: number
): wtypes.OptInASAParam {
  return {
    type: wtypes.TransactionType.OptInASA,
    sign: wtypes.SignType.SecretKey,
    fromAccount,
    assetID,
    payFlags: { totalFee: fee }
  };
}
