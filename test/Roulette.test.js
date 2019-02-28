const Roulette = artifacts.require('RouletteForTesting');
const Roscoin = artifacts.require('Roscoin');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');
const { assert } = require('chai');
const { getFirstEvent } = require('./util');

BN.ONE_ETH = new BN(10).pow(new BN(18));
BN.ZERO = new BN(0);
BN.ONE = new BN(1);

contract('Roulette', (accounts) => {
  let roulette;
  let roscoin;

  const ownerAccount = accounts[0];
  const bettingAccount = accounts[1];
  const originalBalance = BN.ONE_ETH;

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
      let betSize = (await roulette.maxBet()).muln(11).divn(10);
      let betNumber = BN.ZERO;

      // when, then
      await truffleAssert.reverts(roulette.bet(betNumber, {from: bettingAccount, value: betSize}));
    });

    it("can not bet less than oraclize fee", async () => {
      // given
      let betSize = BN.ZERO;
      let betNumber = BN.ZERO;

      // when, then
      await truffleAssert.reverts(roulette.bet(betNumber, {from: bettingAccount, value: betSize}));
    });
  });

  describe("Playing functionality", () => {
    it("wins when bet on the right number", async () => {
      // given
      let betSize = await roulette.maxBet();
      let betNumber = BN.ZERO;

      // when
      roulette.bet(betNumber, {from: bettingAccount, value: betSize});

      let playEvent = await getFirstEvent(roulette.Play({fromBlock: 'latest'}));
      let callbackTx = await truffleAssert.createTransactionResult(roulette, playEvent.transactionHash);

      // then
      truffleAssert.eventEmitted(callbackTx, 'Play', (ev) => {
        return ev.player === bettingAccount && ev.betNumber.eq(ev.winningNumber);
      });
      truffleAssert.eventEmitted(callbackTx, 'Payout', (ev) => {
        return ev.winner === bettingAccount && ev.payout.eq(betSize.muln(36));
      });

      let expectedBalance = originalBalance.add(betSize).sub(betSize.muln(36));
      let actualBalance = new BN(await web3.eth.getBalance(roulette.address));
      assert.equal(actualBalance.toString(), expectedBalance.toString(), "Balance should have losses subtracted");
    });

    it("loses when bet on the wrong number", async () => {
      // given
      let betSize = await roulette.maxBet()
      let betNumber = BN.ONE;

      // when
      roulette.bet(betNumber, {from: bettingAccount, value: betSize});

      let playEvent = await getFirstEvent(roulette.Play({fromBlock: 'latest'}));
      let callbackTx = await truffleAssert.createTransactionResult(roulette, playEvent.transactionHash);

      // then
      truffleAssert.eventEmitted(callbackTx, 'Play', (ev) => {
        return ev.player === bettingAccount && !ev.betNumber.eq(ev.winningNumber);
      });
      truffleAssert.eventNotEmitted(callbackTx, 'Payout');

      let expectedBalance = originalBalance.add(betSize);
      let actualBalance = new BN(await web3.eth.getBalance(roulette.address));
      assert.equal(actualBalance.toString(), expectedBalance.toString(), "Balance should have winnings added");
    });

    it("pays an oraclize fee when playing the second time", async () => {
      // given
      let betSize = await roulette.maxBet()
      let betNumber = BN.ONE;

      // when
      let betTx = await roulette.bet(betNumber, {from: bettingAccount, value: betSize});

      // then
      truffleAssert.eventEmitted(betTx, 'Bet', (ev) => {
        return ev.player === bettingAccount && ev.betSize.eq(betSize);
      });

      // when
      betTx = await roulette.bet(betNumber, {from: bettingAccount, value: betSize});

      // then
      truffleAssert.eventEmitted(betTx, 'Bet', (ev) => {
        return ev.player === bettingAccount && ev.betSize.lt(betSize);
      });

      let expectedLtBalance = originalBalance.add(betSize.muln(2));
      let actualBalance = new BN(await web3.eth.getBalance(roulette.address));

      assert.isTrue(actualBalance.lt(expectedLtBalance), "Oraclize fee should be deducted from balance");
    });
  });
  describe("Pausing functionality", () => {
    it("Can not play when paused", async () => {
      // given
      await roulette.pause({from: ownerAccount});
      let betSize = await roulette.maxBet()
      let betNumber = BN.ONE;

      // when, then
      await truffleAssert.reverts(roulette.bet(betNumber, {from: bettingAccount, value: betSize}));
    });
  });
});
