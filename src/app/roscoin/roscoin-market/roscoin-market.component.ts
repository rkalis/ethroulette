import { StatusService } from './../../shared/status.service';
import { BigNumber } from 'bignumber.js';
import { AccountService } from '../../shared/account.service';
import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../shared/web3.service';

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

  balance: number;

  constructor(
    private web3Service: Web3Service,
    private accountService: AccountService,
    private statusService: StatusService
  ) {}

  ngOnInit(): void {
    console.log(this);

    this.web3Service.artifactsToContract(roscoin_artifacts)
      .then((RoscoinAbstraction) => {
        this.Roscoin = RoscoinAbstraction;
        return this.Roscoin.deployed();
      }).then((deployedRoscoin) => {
        this.deployedRoscoin = deployedRoscoin;
        this.watchAccount();
      }).catch((error) => {
        console.log('Roscoin artifacts could not be loaded or deployed Roscoin contract could not be found.');
        console.log(error);
        this.statusService.showStatus('Error connecting with Roscoin contract; see log.');
      });
  }

  watchAccount() {
    this.accountService.accountObservable.subscribe((account) => {
      this.refreshBalance();
    });
  }

  async buy(purchaseAmountInEth: number) {
    if (!this.deployedRoscoin) {
      this.statusService.showStatus('Roscoin contract is not available');
      return;
    }

    const purchaseAmountInWei = this.web3Service.toWei(purchaseAmountInEth, 'ether');
    console.log('Buying ' + purchaseAmountInEth + ' Roscoins');

    this.statusService.showStatus('Initiating transaction... (please wait)');

    try {
      const tx = await this.deployedRoscoin.buy({from: this.accountService.account, value: purchaseAmountInWei});
      this.refreshBalance();

      if (!tx) {
        this.statusService.showStatus('Transaction failed, purchase not completed');
      } else {
        this.statusService.showStatus('Transaction complete, purchase completed');
      }
    } catch (e) {
      console.log(e);
      this.statusService.showStatus('Error purchasing; see log.');
    }
  }

  async sell(saleAmountInRoscoin: number) {
    if (!this.deployedRoscoin) {
      this.statusService.showStatus('Roscoin contract is not available');
      return;
    }

    const saleAmountInWei = this.web3Service.toWei(saleAmountInRoscoin, 'ether');
    console.log('Selling ' + saleAmountInRoscoin + ' Roscoins');

    this.statusService.showStatus('Initiating transaction... (please wait)');

    try {
      const tx = await this.deployedRoscoin.sell(saleAmountInWei, {from: this.accountService.account});
      this.refreshBalance();

      if (!tx) {
        this.statusService.showStatus('Transaction failed, sale not completed');
      } else {
        this.statusService.showStatus('Transaction complete, sale completed');
      }
    } catch (e) {
      console.log(e);
      this.statusService.showStatus('Error selling; see log.');
    }
  }

  refreshBalance = async () => {
    console.log('Refreshing balance');
    try {
      console.log('Account: ', this.accountService.account);
      const roscoinBalanceInWei: BigNumber = await this.deployedRoscoin.balanceOf(this.accountService.account);
      const roscoinBalance = this.web3Service.fromWei(roscoinBalanceInWei, 'ether');
      console.log('Found balance: ' + roscoinBalance);
      this.balance = roscoinBalance;
    } catch (e) {
      console.log(e);
      this.statusService.showStatus('Error getting balance; see log.');
    }
  }
}
