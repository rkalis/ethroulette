const Roulette = artifacts.require('RouletteForTesting');
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
    const investmentSize = 1e18;

    let debugEvent;

    beforeEach(async () => {
        roulette = await Roulette.new({from: ownerAccount});
    });
    afterEach(async () => {
        await roulette.kill({from: ownerAccount});
    });

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

    it("can divest when sufficiently invested", async () => {
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

    it("can not divest when insufficiently invested", async () => {
        // given
        await roulette.invest({from: ownerAccount, value: investmentSize});

        let tokenPriceBeforeDivestment = (await roulette.tokenPrice()).toNumber();

        let divestmentSizeInEth = investmentSize * 1.1;
        let divestmentSizeInTokens = divestmentSizeInEth / tokenPriceBeforeDivestment * 1e18;

        // when, then
        await assert.isRejected(roulette.divest(divestmentSizeInTokens, {from: ownerAccount}));
    })

    it("wins when bet on the right number", async () => {
        // given
        await roulette.invest({from: ownerAccount, value: investmentSize});
        let betSize = (await roulette.maxBet()).toNumber()
        let betNumber = 0;

        // when
        let betTx = await roulette.bet(betNumber, {from: bettingAccount, value: betSize});
        let playEvent = await getFirstEvent(roulette.Play({ fromBlock: 'latest' }));
        let callbackTx = await getTransactionResultForEvent(roulette, playEvent);

        // then
        truffleAssert.eventEmitted(callbackTx, 'Play', (ev) => {
            return ev.player === bettingAccount && ev.betNumber.eq(ev.winningNumber);
        });
        truffleAssert.eventEmitted(callbackTx, 'Payout', (ev) => {
            return ev.winner === bettingAccount && ev.payout.eq((BigNumber(36 * betSize)));
        });

        assert.equal(web3.eth.getBalance(roulette.address).toNumber(), investmentSize + betSize - betSize * 36, "Balance should equal investment size minus losses");
    });

    it("loses when bet on the wrong number", async () => {
        // given
        await roulette.invest({from: ownerAccount, value: investmentSize});
        let betSize = (await roulette.maxBet()).toNumber()
        let betNumber = 1;

        // when
        await roulette.bet(betNumber, {from: bettingAccount, value: betSize});
        let playEvent = await getFirstEvent(roulette.Play({ fromBlock: 'latest' }));
        let callbackTx = await getTransactionResultForEvent(roulette, playEvent);

        // then
        truffleAssert.eventEmitted(callbackTx, 'Play', (ev) => {
            return ev.player === bettingAccount && !ev.betNumber.eq(ev.winningNumber);
        });
        truffleAssert.eventNotEmitted(callbackTx, 'Payout');

        assert.equal(web3.eth.getBalance(roulette.address).toNumber(), investmentSize + betSize, "Balance should equal investment size plus winnings");
    });

    it("pays an oraclize fee when playing the second time", async () => {
        // given
        await roulette.invest({from: ownerAccount, value: investmentSize});
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

        assert.isBelow(web3.eth.getBalance(roulette.address).toNumber(), investmentSize + 2 * betSize, "Oraclize fee should be deducted from balance");
    })

    it("can not bet more than max bet", async () => {
        // given
        await roulette.invest({from: ownerAccount, value: investmentSize});
        let betSize = (await roulette.maxBet()).toNumber() * 1.01;
        let betNumber = 0;

        // when, then
        await assert.isRejected(roulette.bet(betNumber, {from: bettingAccount, value: betSize}));
        assert.equal(web3.eth.getBalance(roulette.address).toNumber(), investmentSize, "Balance should be the original investment");
    });

    it("can not play without betting", async () => {
        // given
        await roulette.invest({from: ownerAccount, value: investmentSize});
        let betNumber = 0;

        // when, then
        await assert.isRejected(roulette.bet(betNumber, {from: bettingAccount}));
        assert.equal(web3.eth.getBalance(roulette.address).toNumber(), investmentSize, "Balance should be the original investment");
    });

});

getTransactionResultForEvent = (contract, eventLog) => {
    return new Promise((resolve, reject) => {
        let allEvents = contract.allEvents({fromBlock: eventLog.blockNumber, toBlock: eventLog.blockNumber});
        allEvents.get((error, logs) => {
            if (error !== null)
                reject(error);
            resolve({
                tx: eventLog.transactionHash,
                receipt: web3.eth.getTransactionReceipt(eventLog.transactionHash),
                logs: logs.filter(log => log.transactionHash == eventLog.transactionHash)
            });
        })
    })
}

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
