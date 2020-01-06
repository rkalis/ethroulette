import { ContractService } from './../../core/contract.service';
import { StatusService } from './../../shared/status.service';
import { AccountService } from '../../core/account.service';
import { Component, OnInit } from '@angular/core';
import { Web3Service } from '../../core/web3.service';

@Component({
  selector: 'app-roscoin-market',
  templateUrl: './roscoin-market.component.html',
  styleUrls: ['./roscoin-market.component.css']
})
export class RoscoinMarketComponent implements OnInit {
  accounts: string[];

  balance: string;
  currentPrice: string;

  constructor(
    private web3Service: Web3Service,
    private contractService: ContractService,
    private accountService: AccountService,
    private statusService: StatusService
  ) {}

  ngOnInit(): void {
    console.log(this);
    this.init();
  }

  private async init() {
    try {
      await this.contractService.ready();
      await this.accountService.ready();
      this.watchAccount();
      setInterval(() => this.refreshPrice(), 1000);
      setInterval(() => this.refreshBalance(), 10000);
    } catch (error) {
      console.log(error);
      this.statusService.showStatus('Error connecting with smart contracts; see log.');
    }
  }

  watchAccount() {
    this.accountService.accountObservable.subscribe(this.refreshBalance);
  }

  async buy(purchaseAmountInEth: number) {
    const deployedRoscoin = this.contractService.getDeployedContract('Roscoin');
    if (!deployedRoscoin) {
      this.statusService.showStatus('Roscoin contract is not available');
      return;
    }

    const purchaseAmountInWei = this.web3Service.toWei(purchaseAmountInEth, 'ether');
    console.log('Buying ' + purchaseAmountInEth + ' Roscoins');

    this.statusService.showStatus('Initiating transaction... (please wait)');

    try {
      const tx = await deployedRoscoin.buy({from: this.accountService.account, value: purchaseAmountInWei});
      this.refreshBalance();

      if (!tx) {
        this.statusService.showStatus('Transaction failed, purchase not completed');
      } else {
        this.statusService.showStatus('Transaction complete, purchase completed');
      }
    } catch (error) {
      console.log(error);
      this.statusService.showStatus('Error purchasing; see log.');
    }
  }

  async sell(saleAmountInRoscoin: number) {
    const deployedRoscoin = this.contractService.getDeployedContract('Roscoin');
    if (!deployedRoscoin) {
      this.statusService.showStatus('Roscoin contract is not available');
      return;
    }

    const saleAmountInWei = this.web3Service.toWei(saleAmountInRoscoin, 'ether');
    console.log('Selling ' + saleAmountInRoscoin + ' Roscoins');

    this.statusService.showStatus('Initiating transaction... (please wait)');

    try {
      const tx = await deployedRoscoin.sell(saleAmountInWei, {from: this.accountService.account});
      this.refreshBalance();

      if (!tx) {
        this.statusService.showStatus('Transaction failed, sale not completed');
      } else {
        this.statusService.showStatus('Transaction complete, sale completed');
      }
    } catch (error) {
      console.log(error);
      this.statusService.showStatus('Error selling; see log.');
    }
  }

  refreshBalance = async () => {
    const deployedRoscoin = this.contractService.getDeployedContract('Roscoin');
    console.log('Refreshing balance');
    try {
      console.log('Account: ', this.accountService.account);
      const roscoinBalanceInWei = await deployedRoscoin.balanceOf(this.accountService.account);
      const roscoinBalance = this.web3Service.fromWei(roscoinBalanceInWei, 'ether');
      console.log('Found balance: ' + roscoinBalance);
      this.balance = roscoinBalance;
    } catch (error) {
      console.log(error);
      this.statusService.showStatus('Error getting balance; see log.');
    }
  }

  refreshPrice = async () => {
    const deployedRoscoin = this.contractService.getDeployedContract('Roscoin');
    console.log('Refreshing price');
    try {
      const tokenPriceInWei = await deployedRoscoin.tokenPrice();
      const tokenPrice = this.web3Service.fromWei(tokenPriceInWei, 'ether');
      console.log('Found price: ' + tokenPrice);
      this.currentPrice = tokenPrice;
    } catch (error) {
      console.log(error);
      this.statusService.showStatus('Error getting token price; see log.');
    }
  }
}
