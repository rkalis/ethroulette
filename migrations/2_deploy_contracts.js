var Roscoin = artifacts.require("Roscoin");
var Roulette = artifacts.require("Roulette");

module.exports = (deployer) => {
  deployer.deploy(Roscoin).then(() => {
    return deployer.deploy(Roulette, Roscoin.address, { gas: 5000000 });
  });
};
