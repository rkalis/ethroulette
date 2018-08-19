import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { MatSnackBar } from '@angular/material';

declare let require: any;
const metacoin_artifacts = require('../../../../build/contracts/MetaCoin.json');
const roulette_artifacts = require('../../../../build/contracts/Roulette.json');

@Component({
  selector: 'app-roulette-player',
  templateUrl: './roulette-player.component.html',
  styleUrls: ['./roulette-player.component.css']
})
export class RoulettePlayerComponent implements OnInit {
  accounts: string[];
  Roulette: any;

  model = {
    balance: 0,
    account: ''
  };

  status = '';

  constructor(private web3Service: Web3Service, private matSnackBar: MatSnackBar) {
    console.log('Constructor: ' + web3Service);
  }

  ngOnInit(): void {
    console.log('OnInit: ' + this.web3Service);
    console.log(this);
    this.watchAccount();

    this.web3Service.artifactsToContract(roulette_artifacts)
      .then((RouletteAbstraction) => {
        this.Roulette = RouletteAbstraction;
      });
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.model.account = accounts[0];
      this.refreshBalance();
    });
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  async invest(investmentSize: number) {
    if (!this.Roulette) {
      this.setStatus('Roulette artifacts could not be loaded');
      return;
    }

    console.log('Investing ' + investmentSize);

    this.setStatus('Initiating transaction... (please wait)');

    try {
      const deployedRoulette = await this.Roulette.deployed();
      console.log(deployedRoulette);
      const tx = await deployedRoulette.invest({from: this.model.account, value: investmentSize});

      if (!tx) {
        this.setStatus('Transaction failed, investment not completed');
      } else {
        this.setStatus('Transaction complete, investment completed');
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error investing; see log.');
    }
  }

  async divest(divestmentSize: number) {
    if (!this.Roulette) {
      this.setStatus('Roulette artifacts could not be loaded');
      return;
    }

    console.log('Divesting ' + divestmentSize);

    this.setStatus('Initiating transaction... (please wait)');

    try {
      const deployedRoulette = await this.Roulette.deployed();
      console.log(deployedRoulette);
      const tx = await deployedRoulette.divest(divestmentSize, {from: this.model.account});

      if (!tx) {
        this.setStatus('Transaction failed, divestment not completed');
      } else {
        this.setStatus('Transaction complete, divestment completed');
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error divesting; see log.');
    }
  }

  async bet(number: number, betSize: number) {
    if (!this.Roulette) {
      this.setStatus('Roulette artifacts could not be loaded');
      return;
    }

    console.log('Betting ' + betSize + ' on number ' + number);

    this.setStatus('Initiating transaction... (please wait)');

    try {
      const deployedRoulette = await this.Roulette.deployed();
      console.log(deployedRoulette);
      const tx = await deployedRoulette.bet(number, {from: this.model.account, value: betSize});

      if (!tx) {
        this.setStatus('Transaction failed, bet has not been placed');
      } else {
        this.setStatus('Transaction complete, bet has been placed');
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error placing bet; see log.');
    }
  }

  async refreshBalance() {
    console.log('Refreshing balance');

    try {
      const deployedRoulette = await this.Roulette.deployed();
      console.log(deployedRoulette);
      console.log('Account', this.model.account);
      const roscoinBalance = await deployedRoulette.balanceOf(this.model.account);
      console.log('Found balance: ' + roscoinBalance);
      this.model.balance = roscoinBalance;
    } catch (e) {
      console.log(e);
      this.setStatus('Error getting balance; see log.');
    }
  }
}
