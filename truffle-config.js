const path = require('path');
const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim();
const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  contracts_build_directory: path.join(__dirname, "app/src/contracts"), 

  networks: {
    // $ truffle test --network <network-name>
    develop: {
      port: 8545
    },    
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    }, 
    mumbai: {
      provider: () => new HDWalletProvider(mnemonic, "https://rpc-mumbai.matic.today"),
      network_id: '80001',
    },     
  },

  mocha: {
    // timeout: 100000
  },

  compilers: {
    solc: {
      version: "0.5.16",
    }
  }
}
