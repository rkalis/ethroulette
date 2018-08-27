const Roulette = artifacts.require('RouletteForTesting');
const Roscoin = artifacts.require('Roscoin');
const BigNumber = require('bignumber.js').BigNumber;
const truffleAssert = require('truffle-assertions');
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
const assert = chai.assert;

contract('Roulette', (accounts) => {
  let roulette;
  let roscoin;

  const ownerAccount = accounts[0];
  const bettingAccount = accounts[1];
  const originalBalance = 1e18;

  beforeEach(async () => {
    roscoin = await Roscoin.new({from: ownerAccount});
    roulette = await Roulette.new(roscoin.address, {from: ownerAccount});
    await roscoin.buy({from: ownerAccount, value: originalBalance});
  });

  afterEach(async () => {
    await roscoin.sell(await roscoin.balanceOf(ownerAccount), {from: ownerAccount})
  });

  describe("Betting functionality", () => {
    it("can not bet more than max bet", async () => {
      // given
      let betSize = (await roulette.maxBet()).toNumber() * 1.1;
      let betNumber = 0;

      // when, then
      await assert.isRejected(roulette.bet(betNumber, {from: bettingAccount, value: betSize}));
      assert.equal(web3.eth.getBalance(roulette.address).toNumber(), originalBalance, "Balance should be unchanged");
    });

    it("can not bet less than oraclize fee", async () => {
      // given
      let betSize = 0;
      let betNumber = 0;

      // when, then
      await assert.isRejected(roulette.bet(betNumber, {from: bettingAccount, value: betSize}));
      assert.equal(web3.eth.getBalance(roulette.address).toNumber(), originalBalance, "Balance should be unchanged");
    });
  });

  describe("Playing functionality", () => {
    it("wins when bet on the right number", async () => {
      // given
      let betSize = (await roulette.maxBet()).toNumber()
      let betNumber = 0;

      // when
      await roulette.bet(betNumber, {from: bettingAccount, value: betSize});
      let playEvent = await getFirstEvent(roulette.Play({fromBlock: 'latest'}));
      let callbackTx = await truffleAssert.createTransactionResult(roulette, playEvent.transactionHash);

      // then
      truffleAssert.eventEmitted(callbackTx, 'Play', (ev) => {
        return ev.player === bettingAccount && ev.betNumber.eq(ev.winningNumber);
      });
      truffleAssert.eventEmitted(callbackTx, 'Payout', (ev) => {
        return ev.winner === bettingAccount && ev.payout.eq((BigNumber(36 * betSize)));
      });

      assert.equal(web3.eth.getBalance(roulette.address).toNumber(), originalBalance + betSize - betSize * 36, "Balance should have losses subtracted");
    });

    it("loses when bet on the wrong number", async () => {
      // given
      let betSize = (await roulette.maxBet()).toNumber()
      let betNumber = 1;

      // when
      await roulette.bet(betNumber, {from: bettingAccount, value: betSize});
      let playEvent = await getFirstEvent(roulette.Play({fromBlock: 'latest'}));
      let callbackTx = await truffleAssert.createTransactionResult(roulette, playEvent.transactionHash);

      // then
      truffleAssert.eventEmitted(callbackTx, 'Play', (ev) => {
        return ev.player === bettingAccount && !ev.betNumber.eq(ev.winningNumber);
      });
      truffleAssert.eventNotEmitted(callbackTx, 'Payout');

      assert.equal(web3.eth.getBalance(roulette.address).toNumber(), originalBalance + betSize, "Balance should have winnings added");
    });

    it("pays an oraclize fee when playing the second time", async () => {
      // given
      let betSize = (await roulette.maxBet()).toNumber()
      let betNumber = 1;

      // when
      let betTx = await roulette.bet(betNumber, {from: bettingAccount, value: betSize});

      // then
      truffleAssert.eventEmitted(betTx, 'Bet', (ev) => {
        return ev.player === bettingAccount && ev.betSize.eq(BigNumber(betSize));
      });

      // when
      betTx = await roulette.bet(betNumber, {from: bettingAccount, value: betSize});

      // then
      truffleAssert.eventEmitted(betTx, 'Bet', (ev) => {
        return ev.player === bettingAccount && ev.betSize.lt(BigNumber(betSize));
      });

      assert.isBelow(web3.eth.getBalance(roulette.address).toNumber(), originalBalance + 2 * betSize, "Oraclize fee should be deducted from balance");
    });
  });
  describe("Pausing functionality", () => {
    it("Can not play when paused", async () => {
      // given
      await roulette.pause({from: ownerAccount});
      let betSize = (await roulette.maxBet()).toNumber()
      let betNumber = 1;

      // when, then
      await assert.isRejected(roulette.bet(betNumber, {from: bettingAccount, value: betSize}));
    });
  });
});

getFirstEvent = (_event) => {
  return new Promise((resolve, reject) => {
    _event.watch((error, log) => {
      _event.stopWatching();
      if (error !== null)
      reject(error);
      resolve(log);
    });
  });
}
