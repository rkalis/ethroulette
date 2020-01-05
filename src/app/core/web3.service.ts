import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { BigNumber } from 'bignumber.js';

declare let require: any;
const Web3 = require('web3');
const TruffleContract = require('@truffle/contract');

declare let window: any;

@Injectable()
export class Web3Service {
  private web3: any;
  private accounts: string[];
  public _ready: Promise<any>;
  public accountsObservable = new Subject<string[]>();

  constructor() {
    console.log(this);
    this._ready = new Promise((resolve, reject) => {
      window.addEventListener('load', (event) => {
        this.bootstrapWeb3();
        return resolve();
      });
    });
  }

  ready(): Promise<any> {
    return this._ready;
  }

  public async bootstrapWeb3() {
    try {
      if (window.ethereum) {
        await window.ethereum.enable();
      }
      this.web3 = new Web3(window.web3.currentProvider);
    } catch(e) {
      console.log(e)
    }

    setInterval(() => this.refreshAccounts(), 1000);
  }

  public toWei(amount: number, unit: string): string {
    return this.web3.utils.toWei(amount.toString(), unit);
  }

  public fromWei(amount: BigNumber, unit: string): string {
    return this.web3.utils.fromWei(amount.toString(), unit);
  }

  public async artifactsToContract(artifacts) {
    while (!this.web3) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    const contractAbstraction = TruffleContract(artifacts);
    contractAbstraction.setProvider(this.web3.currentProvider);
    return contractAbstraction;
  }

  private refreshAccounts() {
    this.web3.eth.getAccounts((err, accs) => {
      console.log('Refreshing accounts');
      if (err != null) {
        console.warn('There was an error fetching your accounts.');
        return;
      }

      // Get the initial account balance so it can be displayed.
      if (accs.length === 0) {
        console.warn('Couldn\'t get any accounts! Make sure your Ethereum client is configured correctly.');
        return;
      }

      if (!this.accounts || this.accounts.length !== accs.length || this.accounts[0] !== accs[0]) {
        console.log('Observed new accounts');

        this.accountsObservable.next(accs);
        this.accounts = accs;
      }
    });
  }
}
