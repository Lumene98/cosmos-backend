import config from '../algob.config';

const masterAccount = (config.networks.default.accounts.filter(account => account.name === 'master-account'))[0];
const aliceAccount = (config.networks.default.accounts.filter(account => account.name === 'alice'))[0];
const bobAccount = (config.networks.default.accounts.filter(account => account.name === 'bob'))[0];

export default {
  escrowBalance: 20e5, // 0.20 ALGO
  initialAccountBalance: 3e6, // 3 ALGO
  masterBalance: 10e6, // 10 ALGO
  fee: 1e3,
  masterAddr: masterAccount.addr,
  aliceAddr: aliceAccount.addr,
  bobAccount: bobAccount.addr
};
