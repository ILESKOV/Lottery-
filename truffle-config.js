const HDWalletProvider = require('@truffle/hdwallet-provider')
require('dotenv').config()

const mnemonic = process.env.MNEMONIC
const url = process.env.RPC_URL

module.exports = {
  networks: {
    cldev: {
      host: '127.0.0.1',
      port: 8545,
      network_id: '*',
    },
    // ganache: {
    //   host: '127.0.0.1',
    //   port: 7545,
    //   network_id: '*',
    // },
    // binance_testnet: {
    //   provider: () => new HDWalletProvider(mnemonic,'https://data-seed-prebsc-1-s1.binance.org:8545'),
    //   network_id: 97,
    //   confirmations: 10,
    //   timeoutBlocks: 200,
    //   skipDryRun: true
    // },
    // kovan: {
    //   provider: () => {
    //     return new HDWalletProvider(mnemonic, url)
    //   },
    //   network_id: '42',
    //   skipDryRun: true
    // },
    rinkeby: {
      provider: () => {
        return new HDWalletProvider(mnemonic, url)
      },
      network_id: '4',
      gas: 5500000,  
      skipDryRun: true,
      networkCheckTimeoutnetworkCheckTimeout: 10000, 
      timeoutBlocks: 200     
    },
  },
  compilers: {
    solc: {
      version: '0.8.13',
    },
  },
}
