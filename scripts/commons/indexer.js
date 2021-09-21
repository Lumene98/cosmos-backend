const { default: algosdk, encodeAddress } = require('algosdk');

(async () => {
  try {
    const indexerClient = new algosdk.Indexer('', 'https://testnet.algoexplorerapi.io/idx2', '');
    const algodClient = new algosdk.Algodv2('', 'https://testnet.algoexplorerapi.io', '');

    const assets = (await indexerClient.lookupAccountByID('CXMO4VYMQUFRY2ESNFE46ZDQRAWI6NWWIEML6ZRWRBAWQ3NR4YLDVYMYSA').do()).account.assets;

    const balances = [];

    for (let i = 0; i < assets.length; i++) {
      balances.push(await indexerClient.lookupAssetBalances(assets[i]['asset-id']).currencyGreaterThan('0').do());
    }

    const accounts = balances.map(balance => balance.balances[0].address);
    const escrows = [];

    for (const account of accounts) {
      const accountInfoResponse = await algodClient.accountInformation(account).do();
      for (const app of accountInfoResponse['apps-local-state']) {
        if (app.id === 24615060 && app['key-value']) {
          const escrow = { localState: {} };
          for (const state of app['key-value']) {
            const key = Buffer.from(state.key, 'base64').toString();

            let value;
            switch (state.value.type) {
              case 1:
                if (key.search('address')) {
                  value = encodeAddress(Buffer.from(state.value.bytes, 'base64'));
                } else {
                  value = Buffer.from(state.value.bytes, 'base64').toString();
                }
                break;
              case 2:
                value = state.value.uint;
                break;
            }
            escrow.localState[key] = value;
          }
          escrow.address = account;
          if (escrow.localState.end_round) {
            escrow.isAuction = true;
          } else {
            escrow.isAuction = false;
          }

          escrows.push(escrow);
        }
      }
    }

    console.log(escrows);
  } catch (error) {
    console.error(error);
  }
})();
