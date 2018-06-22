var Roulette = artifacts.require("Roulette");

module.exports = function(deployer) {
    deployer.deploy(Roulette, 100);
};
