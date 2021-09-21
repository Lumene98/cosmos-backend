import { convert } from '@algo-builder/algob';
import { LogicSig, types as rtypes } from '@algo-builder/runtime';
import { types as wtypes } from '@algo-builder/web';

import {
  getAssetCloseTxnWithLsig,
  getAssetTransferTxn,
  getAssetTransferTxnWithLsig,
  getCallAppCloseToWithLogicSig,
  getCallAppTxn,
  getOptIntoAppTxnWithLogicSig,
  getOptIntoAssetTxnFromLogicSig,
  getPaymentTxn,
  getPaymentTxnWithLsig
} from './protocolTxn';

/**
 * tx 0 - Opt in escrow into NFT
 * tx 1 - Opt in escrow into App
 * tx 2 - Call to App with application arg: 'cs'(create sell), price
 * tx 3 - Asset transfer from User -> Escrow. Transferring the NFT.
 */
export function getCreateSellTxGroup (
  appId: number,
  escrow: LogicSig,
  user: rtypes.Account,
  fee: number,
  assetID: number,
  price: number
): wtypes.ExecParams[] {
  const txEscrowOptInIntoNFT = getOptIntoAssetTxnFromLogicSig(escrow.address(), assetID, escrow, 0);
  const txEscrowOptInIntoApp = getOptIntoAppTxnWithLogicSig(escrow.address(), appId, [], escrow, 0);
  const txAppCall = getCallAppTxn(user, appId, ['str:cs', `int:${price}`], 0, [escrow.address()], assetID);
  const txAssetTransfer = getAssetTransferTxn(user, escrow.address(), assetID, 1, fee * 4);
  return [
    txEscrowOptInIntoNFT,
    txEscrowOptInIntoApp,
    txAppCall,
    txAssetTransfer
  ];
}

/**
 * tx 0 - Opt in escrow into NFT
 * tx 1 - Opt in escrow into App
 * tx 2 - Call to App with application arg: 'ca'(create auction), initial price, end(in rounds)
 * tx 3 - Asset transfer from User -> Escrow. Transferring the NFT.
 */
export function getCreateAuctionTxGroup (
  appId: number,
  escrow: LogicSig,
  user: rtypes.Account,
  fee: number,
  assetID: number,
  initialPrice: number,
  endRound: number
): wtypes.ExecParams[] {
  const txEscrowOptInIntoNFT = getOptIntoAssetTxnFromLogicSig(escrow.address(), assetID, escrow, 0);
  const txEscrowOptInIntoApp = getOptIntoAppTxnWithLogicSig(escrow.address(), appId, [], escrow, 0);
  const txAppCall = getCallAppTxn(user, appId, ['str:ca', convert.uint64ToBigEndian(initialPrice), convert.uint64ToBigEndian(endRound)], 0, [escrow.address()], assetID);
  const txAssetTransfer = getAssetTransferTxn(user, escrow.address(), assetID, 1, fee * 4);
  return [
    txEscrowOptInIntoNFT,
    txEscrowOptInIntoApp,
    txAppCall,
    txAssetTransfer
  ];
}

/*
 * tx 0 - Call to App with application arg: 'b'(buy)
 * tx 1 - Payment from User -> Escrow. Paying for the NFT.
 * tx 2 - Transfer from Escrow -> User. Transferring the NFT.
 */
export function getBuyGroup (
  appId: number,
  escrow: LogicSig,
  user: rtypes.Account,
  fee: number,
  assetID: number,
  price: number
): wtypes.ExecParams[] {
  const txAppCall = getCallAppTxn(user, appId, ['str:b'], 0, [escrow.address()], assetID);
  const txPayment = getPaymentTxn(user, escrow.address(), price, fee * 3);
  const txAssetTransfer = getAssetTransferTxnWithLsig(escrow, user.addr, assetID, 1, 0);
  return [
    txAppCall,
    txPayment,
    txAssetTransfer
  ];
}
/**
 * tx 0 - Call to App with application arg: 'rce'(reedem and close escrow)
 * tx 1 - AssetClose for Escrow
 * tx 2 - AppClose for Escrow
 * tx 3 - Payment from Escrow -> User with close remainder
 */
export function getReedemAndCloseEscrowGroup (
  appId: number,
  escrow: LogicSig,
  user: rtypes.Account,
  fee: number,
  assetID: number,
  amount?: number
): wtypes.ExecParams[] {
  const txAppCall = getCallAppTxn(user, appId, ['str:rce'], fee * 4, [escrow.address()], assetID);
  const txAssetClose = getAssetCloseTxnWithLsig(escrow, user.addr, assetID, amount ?? 0, 0);
  const txAppClose = getCallAppCloseToWithLogicSig(escrow, appId, [], 0, assetID);
  const txPayment = getPaymentTxnWithLsig(escrow, user.addr, 0, 0, user.addr);
  return [
    txAppCall,
    txAssetClose,
    txAppClose,
    txPayment
  ];
}

/**
 * tx 0 - Call to App with application arg: 'oa'(offer auction)
 */
export function getOfferAutionGroup (
  appId: number,
  escrow: LogicSig,
  user: rtypes.Account,
  fee: number,
  offer: number,
  assetID: number
): wtypes.ExecParams[] {
  const txAppCall = getCallAppTxn(user, appId, ['str:oa', convert.uint64ToBigEndian(offer)], fee, [escrow.address()], assetID);
  return [
    txAppCall

  ];
}
