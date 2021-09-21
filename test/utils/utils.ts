import { getProgram } from '@algo-builder/algob';
import { AccountStore, Runtime } from '@algo-builder/runtime';

import { getPaymentTxn } from './protocolTxn';

export class StateUtil {
  applicationId: number;
  runtime: Runtime;

  constructor (applicationId: number, runtime: Runtime) {
    this.runtime = runtime;
    this.applicationId = applicationId;
  }

  public getGlobal (key: any): any {
    return this.runtime.getGlobalState(this.applicationId, key);
  }

  public getLocal (address: any, key: any): any {
    return this.runtime.getLocalState(this.applicationId, address, key);
  }
}

export function setupEscrow (runtime: Runtime, program: string, assetID: number | undefined, appId: number, fundingAccount: AccountStore, fundingAmount: number, fee: number): any {
  const escrowContract = getProgram(program, {
    ASSET_ID: assetID,
    USER_ADDRESS: fundingAccount.address,
    APP_ID: appId
  });
  const escrowLsig = runtime.getLogicSig(escrowContract, []);
  const escrowContractAddress = escrowLsig.address();

  const fundingTxn = getPaymentTxn(fundingAccount.account, escrowContractAddress, fundingAmount, fee);
  runtime.executeTx(fundingTxn);

  return escrowLsig;
}
