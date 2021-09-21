const { generateAccount, secretKeyToMnemonic } = require('algosdk');

(async () => {
  try {
    const wallet = generateAccount();
    console.log(wallet.addr, secretKeyToMnemonic(wallet.sk));
  } catch (error) {
    console.error(error);
  }
})();
