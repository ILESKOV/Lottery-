
const Lottery = artifacts.require('Lottery')
const { LinkToken } = require('@chainlink/contracts/truffle/v0.4/LinkToken')
//'@chainlink/contracts/truffle/v0.8/LinkTokeninterface.js'
module.exports = async (deployer, network, [defaultAccount]) => {
  if(!network.startsWith('rinkeby')) {
     console.log('Currently only works with Rinkeby!')
     LinkToken.setProvider(deployer.provider)
  }else{
    const subscriptionId = 3963;
    const priceFeed = '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e';
    const vrfCoordinator = '0x6168499c0cFfCaCD319c818142124B7A15E857ab';
    const keyHash = '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc';
    // Deploy rinkeby
    deployer.deploy(Lottery, subscriptionId, priceFeed, vrfCoordinator, keyHash)
  }
}
