const { assert } = require('chai')
const truffleAssert = require('truffle-assertions')
const toWei = (value) => web3.utils.toWei(String(value))

contract('Lottery', accounts => {
   const Lottery = artifacts.require('Lottery')
   const VRFCoordinatorMock = artifacts.require('VRFCoordinatorV2Mock')
   const MockPriceFeed = artifacts.require('MockV3Aggregator')
   const { LinkToken } = require('@chainlink/contracts/truffle/v0.4/LinkToken')

   const defaultAccount = accounts[0]
   const player1 = accounts[1]
   const player2 = accounts[2]
   const player3 = accounts[3]

  let lottery, vrfCoordinatorMock, link, keyhash, fee, mockPriceFeed, subscriptionId;

    describe('#lottery tests', () => {
        let price = '250000000000' //2500 usd
        beforeEach(async () => {
            //For tests, I disabled subscriptions, but this argument needs to be submitted
            subscriptionId = 3963; 
            keyhash = '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc'
            fee = '250000000000000000' // 0.25 LINK(PREMIUM)
            link = await LinkToken.new({ from: defaultAccount })
            mockPriceFeed = await MockPriceFeed.new(8, price, { from: defaultAccount })
            vrfCoordinatorMock = await VRFCoordinatorMock.new(fee, 
                                                          1e9/*0.000000001 LINK per gas*/,
                                                          { from: defaultAccount })
            lottery = await Lottery.new(
                subscriptionId,
                mockPriceFeed.address,
                vrfCoordinatorMock.address,
                keyhash,
                { from: defaultAccount }
            )
        })
        it('starts in closed state', async () => {
            assert(await lottery.lotteryState() == 1)
        })
        it('start at open state after startLottery', async () => {
            await lottery.startLottery({ from: defaultAccount })
            assert(await lottery.lotteryState() == 0)
        })
        it('corrects get the participation fee', async () => {
            let participationFee = await lottery.getParticipationFee()
            assert(participationFee.toString() == toWei(0.02))
        })
        it('disallow participation without enough money', async () => {
            await lottery.startLottery({ from: defaultAccount })
            await truffleAssert.reverts(
                lottery.participate({ from: defaultAccount, value: 0 }),
                "Not Enough ETH to participate!"
            )
        })
        it('check lottery balance after lottery started', async () => {
            await lottery.startLottery({ from: defaultAccount })
            let participationFee = await lottery.getParticipationFee()
            await lottery.participate({ from: player1, value: participationFee.toString() })
            await lottery.participate({ from: player2, value: participationFee.toString() })
            await lottery.participate({ from: player3, value: participationFee.toString() })
            assert(await lottery.getLotteryBalance() == participationFee * 3)
        })
        it('check endLottery conditions', async () => {
            await lottery.startLottery({ from: defaultAccount })
            let participationFee = await lottery.getParticipationFee()
            await lottery.participate({ from: player1, value: participationFee.toString() })
            await lottery.participate({ from: player2, value: participationFee.toString() })
            await lottery.participate({ from: player3, value: participationFee.toString() })
            await lottery.endLottery({ from: defaultAccount })
            assert(await lottery.lotteryState() == 2)
            await vrfCoordinatorMock.fulfillRandomWords(1, lottery.address, { from: defaultAccount })
            let randomWords = await lottery.s_randomWords(0)
            assert(await randomWords != 0 && await lottery.lotteryState() == 1 &&
                   await lottery.getLotteryBalance() == 0)

        })
    })
})
