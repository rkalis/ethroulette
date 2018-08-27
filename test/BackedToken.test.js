const BackedToken = artifacts.require('BackedToken');
const BackingContract = artifacts.require('BackingContract');
const truffleAssert = require('truffle-assertions');
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
const assert = chai.assert;

contract('BackedToken', (accounts) => {
  let backedToken;
  let backingContract;

  const ownerAccount = accounts[0];

  describe("Backing functionality", () => {
    it("can be backed by backing contract", async() => {
      // given
      backedToken = await BackedToken.new({from: ownerAccount});

      // when
      backingContract = await BackingContract.new(backedToken.address, {from: ownerAccount});

      // then
      assert.equal(await backedToken.backingContract(), backingContract.address);
      assert.equal(await backingContract.backedToken(), backedToken.address);
    });

    it("can not be backed by regular account", async() => {
      // given
      backedToken = await BackedToken.new({from: ownerAccount});

      // when, then
      await assert.isRejected(backedToken.back({from: ownerAccount}));
    });

    it("can only be backed once", async() => {
      // given
      backedToken = await BackedToken.new({from: ownerAccount});
      backingContract = await BackingContract.new(backedToken.address, {from: ownerAccount});

      // when, then
      await assert.isRejected(BackingContract.new(backedToken.address, {from: ownerAccount}));
    });
  });

  describe("Token functionality", () => {
    const buyerAccount = accounts[1];
    const receiverAccount = accounts[2];
    const purchaseEthAmount = 1e18;

    beforeEach(async () => {
      backedToken = await BackedToken.new({from: ownerAccount});
      backingContract = await BackingContract.new(backedToken.address, {from: ownerAccount});
    });

    describe("Buying", () => {
      it("can be bought", async() => {
        // given
        let tokenPriceBeforePurchase = (await backedToken.tokenPrice()).toNumber();

        // when
        let tx = await backedToken.buy({from: buyerAccount, value: purchaseEthAmount});

        // then
        let expectedTokenBalance = purchaseEthAmount / tokenPriceBeforePurchase * 1e18;
        assert.equal((await backedToken.balanceOf(buyerAccount)).toNumber(), expectedTokenBalance, "Token balance should match");

        assert.equal((await backedToken.tokenPrice()).toNumber(), tokenPriceBeforePurchase, "Token price should not change");

        truffleAssert.eventEmitted(tx, 'Buy', (ev) => {
            return ev.buyer == buyerAccount && ev.ethAmount == purchaseEthAmount &&
                   ev.tokenPrice == tokenPriceBeforePurchase && ev.tokenAmount == expectedTokenBalance;
        });
      });
      it("purchase proceedings are sent to the backing contract", async() => {
        // when
        await backedToken.buy({from: buyerAccount, value: purchaseEthAmount});

        // then
        assert.equal(web3.eth.getBalance(backingContract.address).toNumber(), purchaseEthAmount, "Backing contract balance should equal purchase eth amount");
      });
    });

    describe("Selling", () => {
      beforeEach(async () => {
        await backedToken.buy({from: buyerAccount, value: purchaseEthAmount});
      });

      it("can be sold with sufficient balance", async() => {
        // given
        let tokenPriceBeforeSale = (await backedToken.tokenPrice()).toNumber();
        let saleEthAmount = purchaseEthAmount / 2;
        let saleTokenAmount = saleEthAmount / tokenPriceBeforeSale * 1e18;
        let remainingBalance = purchaseEthAmount - saleEthAmount;

        // when
        let tx = await backedToken.sell(saleTokenAmount, {from: buyerAccount});

        // then
        let expectedTokenBalance = remainingBalance / tokenPriceBeforeSale * 1e18;
        assert.equal((await backedToken.balanceOf(buyerAccount)).toNumber(), expectedTokenBalance, "Token balance should match");

        assert.equal(tokenPriceBeforeSale, (await backedToken.tokenPrice()).toNumber(), "Token price should not change");

        truffleAssert.eventEmitted(tx, 'Sell', (ev) => {
            return ev.seller == buyerAccount && ev.ethAmount == saleEthAmount &&
                   ev.tokenPrice == tokenPriceBeforeSale && ev.tokenAmount == saleTokenAmount;
        });
      });
      it("can not be sold without sufficient balance", async() => {
        // given
        let tokenPriceBeforeSale = (await backedToken.tokenPrice()).toNumber();
        let saleEthAmount = purchaseEthAmount * 1.1;
        let saleTokenAmount = saleEthAmount / tokenPriceBeforeSale * 1e18;

        // when, then
        await assert.isRejected(backedToken.sell(saleTokenAmount, {from: buyerAccount}));
      });
      it("sale proceedings are removed from backing contract", async() => {
        // given
        let tokenPriceBeforeSale = (await backedToken.tokenPrice()).toNumber();
        let saleEthAmount = purchaseEthAmount / 2;
        let saleTokenAmount = saleEthAmount / tokenPriceBeforeSale * 1e18;
        let remainingBalance = purchaseEthAmount - saleEthAmount;

        // when
        await backedToken.sell(saleTokenAmount, {from: buyerAccount});

        // then
        assert.equal(web3.eth.getBalance(backingContract.address).toNumber(), remainingBalance,
                     "Backing contract balance should equal the purchase proceedings minus sale proceedings");
      });
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
