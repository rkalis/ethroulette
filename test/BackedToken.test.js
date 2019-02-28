const BackedToken = artifacts.require('BackedToken');
const BackingContract = artifacts.require('BackingContract');
const truffleAssert = require('truffle-assertions');
const { assert } = require("chai");
const BN = require('bn.js')

BN.ONE_ETH = new BN(10).pow(new BN(18));
BN.ZERO = new BN(0);
BN.ONE = new BN(1);

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
      await truffleAssert.fails(backedToken.back({from: ownerAccount}));
    });

    it("can only be backed once", async() => {
      // given
      backedToken = await BackedToken.new({from: ownerAccount});
      backingContract = await BackingContract.new(backedToken.address, {from: ownerAccount});

      // when, then
      await truffleAssert.reverts(BackingContract.new(backedToken.address, {from: ownerAccount}));
    });
  });

  describe("Token functionality", () => {
    const buyerAccount = accounts[1];
    const purchaseEthAmount = BN.ONE_ETH;

    beforeEach(async () => {
      backedToken = await BackedToken.new({from: ownerAccount});
      backingContract = await BackingContract.new(backedToken.address, {from: ownerAccount});
    });

    describe("Buying", () => {
      it("can be bought", async() => {
        // given
        let tokenPriceBeforePurchase = await backedToken.tokenPrice();

        // when
        let tx = await backedToken.buy({from: buyerAccount, value: purchaseEthAmount});

        // then
        let expectedTokenBalance = purchaseEthAmount.mul(BN.ONE_ETH).div(tokenPriceBeforePurchase);
        let actualTokenBalance = await backedToken.balanceOf(buyerAccount);
        let tokenPrice = await backedToken.tokenPrice();

        assert.equal(actualTokenBalance.toString(), expectedTokenBalance.toString(), "Token balance should match");
        assert.equal(tokenPrice.toString(), tokenPriceBeforePurchase.toString(), "Token price should not change");

        truffleAssert.eventEmitted(tx, 'Buy', (ev) => {
          return ev.buyer == buyerAccount && ev.ethAmount.eq(purchaseEthAmount) &&
                 ev.tokenPrice.eq(tokenPriceBeforePurchase) && ev.tokenAmount.eq(expectedTokenBalance);
        });
      });

      it("purchase proceedings are sent to the backing contract", async() => {
        // when
        await backedToken.buy({from: buyerAccount, value: purchaseEthAmount});

        // then
        let contractBalance = new BN(await web3.eth.getBalance(backingContract.address));
        assert.equal(
          contractBalance.toString(), purchaseEthAmount.toString(),
          "Backing contract balance should equal purchase eth amount"
        );
      });
    });

    describe("Selling", () => {
      beforeEach(async () => {
        await backedToken.buy({from: buyerAccount, value: purchaseEthAmount});
      });

      it("can be sold with sufficient balance", async() => {
        // given
        let tokenPriceBeforeSale = await backedToken.tokenPrice();
        let saleEthAmount = purchaseEthAmount.divn(2);
        let saleTokenAmount = saleEthAmount.mul(BN.ONE_ETH).div(tokenPriceBeforeSale);
        let remainingBalance = purchaseEthAmount.sub(saleEthAmount);

        // when
        let tx = await backedToken.sell(saleTokenAmount, {from: buyerAccount});

        // then
        let expectedTokenBalance = remainingBalance.mul(BN.ONE_ETH).div(tokenPriceBeforeSale);
        let actualTokenBalance = await backedToken.balanceOf(buyerAccount);
        let tokenPrice = await backedToken.tokenPrice();

        assert.equal(actualTokenBalance.toString(), expectedTokenBalance.toString(), "Token balance should match");
        assert.equal(tokenPrice.toString(), tokenPriceBeforeSale.toString(), "Token price should not change");

        truffleAssert.eventEmitted(tx, 'Sell', (ev) => {
          return ev.seller == buyerAccount && ev.ethAmount.eq(saleEthAmount) &&
                 ev.tokenPrice.eq(tokenPriceBeforeSale) && ev.tokenAmount.eq(saleTokenAmount);
        });
      });

      it("full balance can be sold", async() => {
        // given
        let tokenPriceBeforeSale = await backedToken.tokenPrice();
        let fullBalance = await backedToken.balanceOf(buyerAccount);
        let remainingBalance = BN.ZERO;

        // when
        let tx = await backedToken.sell(fullBalance, {from: buyerAccount});

        // then
        let expectedTokenBalance = remainingBalance;
        let actualTokenBalance = await backedToken.balanceOf(buyerAccount);
        let tokenPrice = await backedToken.tokenPrice();

        assert.equal(actualTokenBalance.toString(), expectedTokenBalance.toString(), "Token balance should be zero");
        assert.equal(tokenPrice.toString(), tokenPriceBeforeSale.toString(), "Token price should not change");

        truffleAssert.eventEmitted(tx, 'Sell', (ev) => {
          return ev.seller == buyerAccount && ev.tokenAmount.eq(fullBalance);
        });
      });

      it("can not be sold without sufficient balance", async() => {
        // given
        let tokenPriceBeforeSale = await backedToken.tokenPrice();
        let saleEthAmount = purchaseEthAmount.muln(11).divn(10);
        let saleTokenAmount = saleEthAmount.mul(BN.ONE_ETH).div(tokenPriceBeforeSale);

        // when, then
        await truffleAssert.reverts(backedToken.sell(saleTokenAmount, {from: buyerAccount}));
      });

      it("sale proceedings are removed from backing contract", async() => {
        // given
        let tokenPriceBeforeSale = await backedToken.tokenPrice();
        let saleEthAmount = purchaseEthAmount.divn(2);
        let saleTokenAmount = saleEthAmount.mul(BN.ONE_ETH).div(tokenPriceBeforeSale);
        let remainingBalance = purchaseEthAmount.sub(saleEthAmount);

        // when
        await backedToken.sell(saleTokenAmount, {from: buyerAccount});

        // then
        let expectedBalance = remainingBalance;
        let actualBalance = new BN(await web3.eth.getBalance(backingContract.address));

        assert.equal(
          actualBalance.toString(), expectedBalance.toString(),
          "Backing contract balance should equal the purchase proceedings minus sale proceedings"
        );
      });
    });
  });
});
