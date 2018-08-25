import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { MatSnackBar } from '@angular/material';

declare let require: any;
const roscoin_artifacts = require('../../../../build/contracts/Roscoin.json');

@Component({
  selector: 'app-roscoin-market',
  templateUrl: './roscoin-market.component.html',
  styleUrls: ['./roscoin-market.component.css']
})
export class RoscoinMarketComponent implements OnInit {
  accounts: string[];
  Roscoin: any;
  deployedRoscoin: any;

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

    this.web3Service.artifactsToContract(roscoin_artifacts)
      .then((RoscoinAbstraction) => {
        this.Roscoin = RoscoinAbstraction;
        return this.Roscoin.deployed();
      }).then((deployedRoscoin) => {
        this.deployedRoscoin = deployedRoscoin;
      }).catch((error) => {
        console.log('Roscoin artifacts could not be loaded or deployed Roscoin contract could not be found.');
        console.log(error);
        this.setStatus('Error connecting with Roscoin contract; see log.');
      });
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      this.accounts = accounts;
      this.model.account = accounts[0];
    });
  }

  setStatus(status) {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  async buy(purchaseAmountInEth: number) {
    if (!this.deployedRoscoin) {
      this.setStatus('Roscoin contract is not available');
      return;
    }

    const purchaseAmountInWei = this.web3Service.toWei(purchaseAmountInEth, 'ether');
    console.log('Buying ' + purchaseAmountInEth + ' Roscoins');

    this.setStatus('Initiating transaction... (please wait)');

    try {
      const tx = await this.deployedRoscoin.buy({from: this.model.account, value: purchaseAmountInWei});
      this.refreshBalance();

      if (!tx) {
        this.setStatus('Transaction failed, purchase not completed');
      } else {
        this.setStatus('Transaction complete, purchase completed');
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error purchasing; see log.');
    }
  }

  async sell(saleAmountInRoscoin: number) {
    if (!this.deployedRoscoin) {
      this.setStatus('Roscoin contract is not available');
      return;
    }

    const saleAmountInWei = this.web3Service.toWei(saleAmountInRoscoin, 'ether');
    console.log('Selling ' + saleAmountInRoscoin + ' Roscoins');

    this.setStatus('Initiating transaction... (please wait)');

    try {
      const tx = await this.deployedRoscoin.sell(saleAmountInWei, {from: this.model.account});
      this.refreshBalance();

      if (!tx) {
        this.setStatus('Transaction failed, sale not completed');
      } else {
        this.setStatus('Transaction complete, sale completed');
      }
    } catch (e) {
      console.log(e);
      this.setStatus('Error selling; see log.');
    }
  }

  async refreshBalance() {
    console.log('Refreshing balance');
    try {
      console.log('Account: ', this.model.account);
      const roscoinBalanceInWei: BigNumber = await this.deployedRoscoin.balanceOf(this.model.account);
      const roscoinBalance = this.web3Service.fromWei(roscoinBalanceInWei, 'ether');
      console.log('Found balance: ' + roscoinBalance);
      this.model.balance = roscoinBalance;
    } catch (e) {
      console.log(e);
      this.setStatus('Error getting balance; see log.');
    }
  }
}
