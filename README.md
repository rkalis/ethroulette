# Eth Roulette
(Last updated and tested 2020-01-05)

Eth Roulette is a fully decentralised and autonomous Casino on the Ethereum blockchain.

In a regular casino, there is a single owner who operates the casino and brings in the profits. Eth Roulette disrupts this process by allowing anyone to invest in the autonomously functioning casino contract. Players can then play roulette using this casino contract without the need for any intermediaries.

## Structure
The structure of this decentralised casino uses two different smart contracts. The [Roulette](/contracts/Roulette.sol) contract contains the actual Roulette functionality, while the [Roscoin](/contracts/Roscoin.sol) contract allows investors to buy and sell tokens that track the performance of the Roulette contract.

These two contracts in turn inherit from [BackingContract](/contracts/BackingContract.sol) and [BackedToken](/contracts/BackedToken.sol), which allow any contract's balance to be used as a backing for any ERC20 token.

[![Contract structure](http://yuml.me/05548485.png)](http://yuml.me/edit/05548485)

More information on the design decisions of this decentralised application can be found [here](/docs/design_pattern_decisions.md).

### Roulette
The Roulette contract allows a player to bet an amount of ETH on a number between 0 and 36. The payout for winning is 36 times the bet amount, equal to a regular roulette table. The random number generation is done through integration with [Oraclize](https://provable.xyz/). This is currently done through their 'WolframAlpha' datasource, but for provably fair random number generation this should be changed to Oraclize's 'Random' datasource.

### Roscoin
Roscoin is an ERC20 token that can be freely bought and sold as a means of investing in the connected Roulette smart contract. The value of this token is computed based on the balance of the Roulette contract and the total supply of Roscoins. When buying Roscoins, the purchase proceedings get forwarded to the Roulette contract so it can be used to pay out any winnings. When selling Roscoins, the sale proceedings are taken back from the Roulette contract.

Because the token's price is derived from the balance of the Roulette contract, this is a way to track the performance of the casino and invest in it.

## Local Installation
### Prerequisites
We need truffle to compile, migrate and test the smart contracts. We need Ganache to run a local development blockchain instance. We need ethereum-bridge to simulate Oraclize functionality within the local Ganache instance. We assume that things like git, npm, yarn, etc. are already installed as well.
```bash
sudo apt install build-essential -y
npm install -g ethereum-bridge truffle ganache-cli
```

MetaMask also needs to be installed to interact with the application inside a browser.

### Run the prerequisites
With the prerequisites installed, we need to run a local Ganache and ethereum-bridge instances. To do this, open three different terminal windows.
In the first window, run Ganache and wait for it to be started. Copy over the mnemonic, as this needs to be entered into MetaMask for local testing.
```
ganache-cli
```

In the second window, run ethereum-bridge, and wait for it to be started (this could take some time).
```
ethereum-bridge -H localhost:8545 -a 9 --dev
```

Ganache and ethereum-bridge need to keep running in the background, while the third terminal window will be used for running the tests / application.

### Compilation & Migration
The project including all dependencies can be set up using Yarn.
```
yarn
```

All contracts can be compiled with Truffle.
```
truffle compile
```

The contracts can be migrated to the running Ganache instance with Truffle.
```
truffle migrate
```

The contracts can also be migrated to the Rinkeby test network or other public Ethereum networks.
```
truffle migrate --network rinkeby
```

To migrate to the Rinkeby testnet, you should also add a mnemonic for your Rinkeby accounts and your Infura project ID to a `.env` file on the root level of this repository.
```
INFURA_ID=<Key here>
MNEMONIC=<Mnemonic here>
```

Versions of the Roulette and Roscoin contracts have been deployed to the Rinkeby test network already. The corresponding addresses can be found [here](/docs/deployed_addresses.txt). The frontend application doesn't always pick up everything correctly, though.

### Unit tests
The tests can be executed with truffle. More information on the unit tests can be found [here](/docs/unit_tests.md).
```
truffle test
```

### Running the frontend
Once the contracts have been succesfully migrated (either to Ganache or Rinkeby), the frontend can be run.
```
yarn start
```

The frontend can then be accessed at `http://localhost:4200/`.

If you are connecting with Ganache, be sure to import the Ganache accounts into MetaMask using the generated mnemonic. If you are connecting with Rinkeby, make sure that your Rinkeby accounts have enough ether to interact with the application.

## Application usage
The application has two different tabs: one to buy and sell Roscoins in order to invest into the casino, and the other to play Roulette. Below, some screenshots are displayed to demonstrate this functionality.

### Buying Roscoins
The 'Roscoin Market' tab displays the account's current Roscoin balance and the current Roscoin price. It allows the user to buy new Roscoins, or sell the ones in their posession.

![Buying Roscoins](/docs/img/buying-roscoins.png)

### Playing Roulette
The 'Play Roulette' tab allows a user to bet an amount of eth on a number between 0 and 36. This bet will be displayed in the current bets and bet history. There is max bet that has been set to 0.5% of the contract's current balance. This value has been chosen to minimise the chances of the casino going bankrupt, while maximising profit and user experience. The full motivation behid this max bet can be found [here](/docs/max_bet_size.md).

![Playing Roulette](/docs/img/playing-roulette.png)

### Bet History
Once the result of a bet has been returned, the bet is removed from the current bets and a winning number is added to the entry in the bet history.

![Roulette history](/docs/img/roulette-history.png)

If the bet number matches the winning number, the winnings will be paid out to the winner, and a payout amount will also be added to the entry in the bet history.

![Winning](/docs/img/winning.png)

### Updated Roscoin price
After these games have been played by roulette players, the balance of the Roulette contract has been changed. Since the value of the Roscoin is backed by this balance, its price will have changed.

![Updated Roscoin price](/docs/img/updated-roscoin-price.png)
