// NOTICE: This config provides sample accounts.
// DON'T use these accounts in any public environment because everyone can see and use them.
// The private keys of these accounts are visible to everyone.
// This means that they can spend the funds and assets.

/**
   Check our /docs/algob-config.md documentation for more ways how to
   load a private keys.
*/

const { mkAccounts, algodCredentialsFromEnv } = require('@algo-builder/algob');
const accounts = mkAccounts([
  {
    name: 'master-account',
    // This account is created using `make setup-master-account` command from our
    // `/infrastructure` directory.
    // It is used in all our examples to setup and fund other accounts (so it must posses ALGOs).
    // If you don't want an account with this address (can check that by running
    // `goal account list -d $ALGORAND_DATA`) then change it to other account you control.
    addr: '4XVEXTXYK4RK7QMUUKSKMQ5UZJPVGF4HRQXH3GF2OERX46MNJGGXG33RUM',
    // To export a mnemonic you may use the following command:
    // goal account export -a "your_account_address" -d $ALGORAND_DATA
    mnemonic: 'inject force sudden match palace jelly minute income sad divert river return couch cash baby gloom course bachelor labor mercy ring nose oblige absorb invest'
  },
  {
    name: 'temp',
    addr: 'CXMO4VYMQUFRY2ESNFE46ZDQRAWI6NWWIEML6ZRWRBAWQ3NR4YLDVYMYSA',
    mnemonic: 'thing clip detect worry reason lawsuit slight just tag access remove mass swing animal swallow ridge kiwi weapon senior chimney enrich mesh margin able play'
  },
  {
    name: 'bob',
    addr: 'E5NYFMJHTL7LOPJXFEKUJDNJ2DVU7EALAKJ67GENSGWWFFMH2QMTJKU6KE',
    mnemonic: 'exact blur spoon regret dizzy wild long idle swing luxury certain brisk twelve swallow wisdom gas stove juice lucky bicycle rent cradle torch able tissue'
  }, {
    name: 'alice',
    addr: '7IS2YMABMVZUII6AXSPNSXJ7ICL2T4VNAAZCC4R6TQUIYPWTHI2Z75HTK4',
    mnemonic: 'nerve clutch hill town sponsor ice clog else filter stock inflict myth festival absorb shaft album onion daring record arctic where govern gloom abandon edit'
  }
]);

// ## ACCOUNTS loaded from a FILE ##
// const { loadAccountsFromFileSync } = require("@algo-builder/algob");
// const accFromFile = loadAccountsFromFileSync("assets/accounts_generated.yaml");
// accounts = accounts.concat(accFromFile);

/// ## Enabling KMD access
/// Please check https://github.com/scale-it/algorand-builder/blob/master/docs/algob-config.md#credentials for more details and more methods.

// process.env.$KMD_DATA = "/path_to/KMD_DATA";
// let kmdCred = KMDCredentialsFromEnv();

// ## Algod Credentials
// You can set the credentials directly in this file:

const defaultCfg = {
  host: 'http://algorand-testnet.dedit.io',
  port: 8080,
  // Below is a token created through our script in `/infrastructure`
  // If you use other setup, update it accordignly (eg content of algorand-node-data/algod.token)
  token: '42fa45bbcbb07c9acbdfa1147c9160c023e945fb18d46052f0f6e3ec86062dc1',
  accounts: accounts
  // if you want to load accounts from KMD, you need to add the kmdCfg object. Please read
  // algob-config.md documentation for details.
  // kmdCfg: kmdCfg,
};

// You can also use Environment variables to get Algod credentials
// Please check https://github.com/scale-it/algorand-builder/blob/master/docs/algob-config.md#credentials for more details and more methods.
// Method 1
process.env.ALGOD_ADDR = 'algorand-testnet.dedit.io:8080';
process.env.ALGOD_TOKEN = '42fa45bbcbb07c9acbdfa1147c9160c023e945fb18d46052f0f6e3ec86062dc1';
const algodCred = algodCredentialsFromEnv();

const envCfg = {
  host: algodCred.host,
  port: algodCred.port,
  token: algodCred.token,
  accounts: accounts
};

module.exports = {
  networks: {
    default: defaultCfg,
    prod: envCfg
  }
};

// NOTICE: This config provides sample accounts.
// DON'T use these accounts in any public environment because everyone can see and use them.
// The private keys of these accounts are visible to everyone.
// This means that they can spend the funds and assets.

/**
   Check our /docs/algob-config.md documentation for more ways how to
   load a private keys.
*/
