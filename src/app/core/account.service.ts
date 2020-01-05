import { Web3Service } from './web3.service';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';


@Injectable()
export class AccountService {
  public accounts: string[];
  public account: string;
  public accountObservable = new Subject<string>();

  private _ready: Promise<any>;

  constructor(
    private web3Service: Web3Service
  ) {
    console.log(this);
    this._ready = (async () => {
      await web3Service.ready();
      this.watchAccount();
    })();
  }

  ready(): Promise<any> {
    return this._ready;
  }

  watchAccount() {
    this.web3Service.accountsObservable.subscribe((accounts) => {
      console.log(accounts);
      if (accounts.length > 0) {
      console.log('Registered new accounts: ', accounts);
      this.accounts = accounts;
      this.account = accounts[0];
      this.accountObservable.next(this.account);
      }
    });
  }
}
