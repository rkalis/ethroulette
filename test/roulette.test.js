const Roulette = artifacts.require('Roulette');
const BigNumber = require('bignumber.js').BigNumber;
const truffleAssert = require('truffle-assertions');
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
const assert = chai.assert;

contract('roulette', async (accounts) => {
    let roulette;

    const fundingAccount = accounts[0];
    const bettingAccount = accounts[1];
    const fundingSize = 100;

    beforeEach(async () => {
        roulette = await Roulette.new({from: fundingAccount});
        await roulette.fund({from: fundingAccount, value: fundingSize});
        assert.equal(web3.eth.getBalance(roulette.address).toNumber(), fundingSize);
    });
    afterEach(async () => {
        await roulette.kill({from: fundingAccount});
    });

    it("should play", async () => {
        roulette.LogDebugInteger({ fromBlock: 'latest' }).watch((error, log) => {
            console.log(log.args.integer.toNumber())
        });

        console.log(web3.eth.getBalance(roulette.address).toNumber());
        console.log((await roulette.token()).toNumber());
        console.log('---------------------------------');
        let res = await roulette.bet(1, {from: bettingAccount, value: 1});
        let log = await promisifyLogWatch(roulette.LogPlay({ fromBlock: 'latest' }));
        console.log('---------------------------------');
        console.log(log.args.betNumber.toNumber());
        console.log(log.args.winningNumber.toNumber());
        console.log('---------------------------------');
        console.log(web3.eth.getBalance(roulette.address).toNumber());
        console.log((await roulette.token()).toNumber());
    })

    // it("should lose when bet on the wrong number", async () => {
    //     // given
    //     let betSize = 1;
    //     let betNumber = web3.eth.getBlock("latest").number % 37;

    //     // when
    //     let tx = await roulette.bet(betNumber, {from: bettingAccount, value: betSize});

    //     // then
    //     truffleAssert.eventEmitted(tx, 'PlayEvent', (ev) => {
    //         return ev.player === bettingAccount && !ev.betNumber.eq(ev.winningNumber);
    //     });
    //     truffleAssert.eventNotEmitted(tx, 'PayoutEvent');
    //     assert.equal(web3.eth.getBalance(roulette.address).toNumber(), fundingSize + betSize);
    // });

    // it("should win when bet on the right number", async () => {
    //     // given
    //     let betSize = 1;
    //     let betNumber = (web3.eth.getBlock("latest").number + 1) % 37;

    //     // when
    //     let tx = await roulette.bet(betNumber, {from: bettingAccount, value: betSize});

    //     // then
    //     truffleAssert.eventEmitted(tx, 'PlayEvent', (ev) => {
    //         return ev.player === bettingAccount && ev.betNumber.eq(ev.winningNumber);
    //     });
    //     truffleAssert.eventEmitted(tx, 'PayoutEvent', (ev) => {
    //         return ev.winner === bettingAccount && ev.payout.eq((BigNumber(36 * betSize)));
    //     });
    //     assert.equal(web3.eth.getBalance(roulette.address).toNumber(), fundingSize + betSize - betSize * 36);
    // });

    // it("should not be able to bet more than max bet", async () => {
    //     // given
    //     let betSize = 2;
    //     let betNumber = 10;

    //     // when, then
    //     await assert.isRejected(roulette.bet(betNumber, {from: bettingAccount, value: betSize}));
    //     assert.equal(web3.eth.getBalance(roulette.address).toNumber(), fundingSize);
    // });

    // it("should not be able to play without betting", async () => {
    //     // given
    //     let betNumber = 10;

    //     // when, then
    //     await assert.isRejected(roulette.bet(betNumber, {from: bettingAccount}));
    //     assert.equal(web3.eth.getBalance(roulette.address).toNumber(), fundingSize);
    // });
});

promisifyLogWatch = (_event) => {
    return new Promise((resolve, reject) => {
      _event.watch((error, log) => {
        _event.stopWatching();
        if (error !== null)
          reject(error);

        resolve(log);
      });
    });
  }
