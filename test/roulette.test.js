const Roulette = artifacts.require('Roulette');
const BigNumber = require('bignumber.js').BigNumber;
const truffleAssert = require('truffle-assertions');
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
const assert = chai.assert;

// TODO: Add more edge case tests

contract('roulette', async (accounts) => {
    let roulette;

    const ownerAccount = accounts[0];
    const bettingAccount = accounts[1];
    const investmentSize = 1000000;

    let debugEvent;

    beforeEach(async () => {
        roulette = await Roulette.new({from: ownerAccount});

        debugEvent = roulette.LogDebugInteger({ fromBlock: 'latest' });
        debugEvent.watch((error, log) => {
            console.log(log.args.integer.toNumber())
        });
    });
    afterEach(async () => {
        debugEvent.stopWatching();
        await roulette.kill({from: ownerAccount});
    });

    it("should play", async () => {
        // await roulette.invest({from: ownerAccount, value: investmentSize});

        // console.log(web3.eth.getBalance(roulette.address).toNumber());
        // console.log((await roulette.tokenPrice()).toNumber());
        // console.log('---------------------------------');
        // let res = await roulette.bet(1, {from: bettingAccount, value: 1});
        // let log = await promisifyLogWatch(roulette.LogPlay({ fromBlock: 'latest' }));
        // console.log('---------------------------------');
        // console.log(log.args.betNumber.toNumber());
        // console.log(log.args.winningNumber.toNumber());
        // console.log('---------------------------------');
        // console.log(web3.eth.getBalance(roulette.address).toNumber());
        // console.log((await roulette.tokenPrice()).toNumber());
    })

    it("can invest", async () => {
        // given
        let tokenPriceBeforeInvestment = (await roulette.tokenPrice()).toNumber();

        // when
        let tx = await roulette.invest({from: ownerAccount, value: investmentSize});

        // then
        assert.equal(web3.eth.getBalance(roulette.address).toNumber(), investmentSize, "Contract balance should equal investment size");

        let expectedTokenBalance = investmentSize / tokenPriceBeforeInvestment * 1e18;
        assert.equal((await roulette.balanceOf(ownerAccount)).toNumber(), expectedTokenBalance, "Token balance should match");

        assert.equal(tokenPriceBeforeInvestment, (await roulette.tokenPrice()).toNumber(), "Token price should not change");

        truffleAssert.eventEmitted(tx, 'Invest', (ev) => {
            return ev.investor == ownerAccount && ev.ethAmount == investmentSize &&
                   ev.tokenPrice == tokenPriceBeforeInvestment && ev.tokenAmount == expectedTokenBalance;
        })
    })

    it("can divest", async () => {
        // given
        await roulette.invest({from: ownerAccount, value: investmentSize});

        let tokenPriceBeforeDivestment = (await roulette.tokenPrice()).toNumber();

        let divestmentSizeInEth = investmentSize / 2;
        let divestmentSizeInTokens = divestmentSizeInEth / tokenPriceBeforeDivestment * 1e18;
        let remainingInvestment = investmentSize - divestmentSizeInEth;

        // when
        let tx = await roulette.divest(divestmentSizeInTokens, {from: ownerAccount});

        // then
        assert.equal(web3.eth.getBalance(roulette.address).toNumber(), remainingInvestment, "Contract balance should equal the remaining investment");

        let expectedTokenBalance = remainingInvestment / tokenPriceBeforeDivestment * 1e18;
        assert.equal((await roulette.balanceOf(ownerAccount)).toNumber(), expectedTokenBalance, "Token balance should match");

        assert.equal(tokenPriceBeforeDivestment, (await roulette.tokenPrice()).toNumber(), "Token price should not change");

        truffleAssert.eventEmitted(tx, 'Divest', (ev) => {
            return ev.investor == ownerAccount && ev.ethAmount == divestmentSizeInEth &&
                   ev.tokenPrice == tokenPriceBeforeDivestment && ev.tokenAmount == divestmentSizeInTokens;
        });
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
