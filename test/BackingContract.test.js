const BackedToken = artifacts.require('BackedToken');
const BackingContract = artifacts.require('BackingContract');
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);
const assert = chai.assert;

// Most of the BackingContract <-> BackedToken functionality is tested in BackedToken.test.js
contract('BackingContract', (accounts) => {
  let backedToken;
  let backingContract;

  const ownerAccount = accounts[0];

  beforeEach(async () => {
    backedToken = await BackedToken.new({from: ownerAccount});
    backingContract = await BackingContract.new(backedToken.address, {from: ownerAccount});
    await backingContract.sendTransaction({from: ownerAccount, value: 1e18});
  });

  it("can not be withdrawn from by regular account", async() => {
    // when, then
    await assert.isRejected(backingContract.withdraw(1e18, {from: ownerAccount}));
  });
});
