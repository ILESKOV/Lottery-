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

    describe('#requests a random number', () => {
        let price = '250000000000' //2500 usd
        beforeEach(async () => {
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
        it('corrects get the participation fee', async () => {
            let participationFee = await lottery.getParticipationFee()
            assert.equal(participationFee.toString(), toWei(0.02))
        })
        it('Disallow participation without enough money', async () => {
            await lottery.startLottery({ from: defaultAccount })
            await truffleAssert.reverts(
                lottery.participate({ from: defaultAccount, value: 0 }),
                "Not Enough ETH to participate!"
            )
        })
        it('start at open state after startLottery', async () => {
            await lottery.startLottery({ from: defaultAccount })
            assert(await lottery.lotteryState() == 0)
        })
        it('Allow participation with enough money', async () => {
            await lottery.startLottery({ from: defaultAccount })
            let participationFee = await lottery.getParticipationFee()
            lottery.participate({ from: player1, value: participationFee.toString() })
            lottery.participate({ from: player2, value: participationFee.toString() })
            lottery.participate({ from: player3, value: participationFee.toString() })
            await link.transfer(lottery.address, toWei(1), { from: defaultAccount })
            let transaction = await lottery.endLottery({ from: defaultAccount })
            let requestId = transaction.receipt.rawLogs[3].topics[0]
            await vrfCoordinatorMock.fulfillRandomWords(requestId, lottery.address, { from: defaultAccount })
            let recentWinner = await lottery.lotteryWinners(1)
            assert.equal(recentWinner, player1)
        })
    })
})
