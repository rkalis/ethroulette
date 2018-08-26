import { StatusService } from './../../shared/status.service';
import { AccountService } from '../../core/account.service';
import { Subject } from 'rxjs/Rx';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Web3Service } from '../../core/web3.service';
import { MatSnackBar, MatTableDataSource } from '@angular/material';

declare let require: any;
const roulette_artifacts = require('../../../../build/contracts/Roulette.json');

@Component({
  selector: 'app-roulette-player',
  templateUrl: './roulette-player.component.html',
  styleUrls: ['./roulette-player.component.css']
})
export class RoulettePlayerComponent implements OnInit {
  accounts: string[];
  Roulette: any;
  deployedRoulette: any;

  constructor(
    private web3Service: Web3Service,
    private accountService: AccountService,
    private statusService: StatusService
  ) {
  }

  ngOnInit(): void {
    console.log(this);

    this.web3Service.artifactsToContract(roulette_artifacts)
      .then((RouletteAbstraction) => {
        this.Roulette = RouletteAbstraction;
        return this.Roulette.deployed();
      }).then((deployedRoulette) => {
        this.deployedRoulette = deployedRoulette;
      }).catch((error) => {
        console.log('Roulette artifacts could not be loaded or deployed Roulette contract could not be found.');
        console.log(error);
        this.statusService.showStatus('Error connecting with Roulette contract; see log.');
      });
  }

  async bet(number: number, betSize: number) {
    if (!this.deployedRoulette) {
      this.statusService.showStatus('Roulette contract is not available');
      return;
    }

    const betSizeInWei = this.web3Service.toWei(betSize, 'ether');
    console.log('Betting ' + betSize + ' on number ' + number);

    this.statusService.showStatus('Initiating transaction... (please wait)');

    try {
      const tx = await this.deployedRoulette.bet(number, {from: this.accountService.account, value: betSizeInWei});

      if (!tx) {
        this.statusService.showStatus('Transaction failed, bet has not been placed');
      } else {
        this.statusService.showStatus('Transaction complete, bet has been placed');
      }
    } catch (e) {
      console.log(e);
      this.statusService.showStatus('Error placing bet; see log.');
    }
  }
}
