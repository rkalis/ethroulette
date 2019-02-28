const BackedToken = artifacts.require('BackedToken');
const BackingContract = artifacts.require('BackingContract');
const truffleAssert = require('truffle-assertions');
const BN = require('bn.js');

BN.ONE_ETH = new BN(10).pow(new BN(18));
BN.ZERO = new BN(0);
BN.ONE = new BN(1);

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
    await truffleAssert.fails(backingContract.withdraw(BN.ONE_ETH, {from: ownerAccount}));
  });
});
