import { AccountService } from './../../account/service/account.service';
import { Subject } from 'rxjs/Rx';
import { environment } from '../../../environments/environment';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Web3Service } from '../../util/web3.service';
import { MatSnackBar, MatTableDataSource } from '@angular/material';

declare let require: any;
const roulette_artifacts = require('../../../../build/contracts/Roulette.json');

export class Bet {
  id: string;
  blockNumber: number;
  betSize: number;
  betNumber: number;
  winningNumber: number;

  constructor(id: string, blockNumber: number, betSize: number, betNumber: number, winningNumber: number) {
    this.id = id;
    this.blockNumber = blockNumber;
    this.betSize = betSize;
    this.betNumber = betNumber;
    this.winningNumber = winningNumber;
  }
}
@Component({
  selector: 'app-bet-history',
  templateUrl: './bet-history.component.html',
  styleUrls: ['./bet-history.component.css']
})
export class BetHistoryComponent implements OnInit {
  Roulette: any;
  deployedRoulette: any;

  betsDataSource: MatTableDataSource<Bet>;
  currentBetsDataSource: MatTableDataSource<Bet>;
  bets: Bet[] = [];

  betEvent: any;
  playEvent: any;

  constructor(
    private web3Service: Web3Service,
    private accountService: AccountService,
    private matSnackBar: MatSnackBar,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log(this);

    this.web3Service.artifactsToContract(roulette_artifacts)
      .then((RouletteAbstraction) => {
        this.Roulette = RouletteAbstraction;
        return this.Roulette.deployed();
      }).then((deployedRoulette) => {
        this.deployedRoulette = deployedRoulette;
        this.watchAccount();
      }).catch((error) => {
        console.log('Roulette artifacts could not be loaded or deployed Roulette contract could not be found.');
        console.log(error);
        this.setStatus('Error connecting with Roulette contract; see log.');
      });
  }

  watchAccount() {
    this.accountService.accountObservable.subscribe((account) => {
      this.betEvent = this.deployedRoulette.Bet({player: account}, {fromBlock: 0, toBlock: 'latest'});
      this.betEvent.get(this.initialiseBets);
      this.betEvent.watch(this.addBet);

      this.playEvent = this.deployedRoulette.Play({player: account}, {fromBlock: 0, toBlock: 'latest'});
      this.playEvent.get(this.initialiseBets);
      this.playEvent.watch(this.addBet);
    });
  }

  initialiseBets = async (error, bets) => {
    if (error != null) {
      console.warn('There was an error fetching your bets.');
      return;
    }

    for (const bet of bets) {
      this.addOrUpdate(new Bet(bet.args.qid, bet.blockNumber, bet.args.betSize, bet.args.betNumber, bet.args.winningNumber));
    }
  }

  addBet = async (error, bet) => {
    if (error != null) {
      console.warn('There was an error fetching your bets.');
      return;
    }

    this.addOrUpdate(new Bet(bet.args.qid, bet.blockNumber, bet.args.betSize, bet.args.betNumber, bet.args.winningNumber));
  }

  addOrUpdate(bet: Bet) {
    const existingBetIndex = this.findBetIndexById(bet.id);
    if (existingBetIndex > -1) {
      if (bet.winningNumber != null) {
        this.bets[existingBetIndex].winningNumber = bet.winningNumber;
        console.log('Updated bet: ', this.bets[existingBetIndex]);
      }
    } else {
      this.bets.push(bet);
      console.log('Added new bet: ', bet);
    }
    this.betsDataSource = new MatTableDataSource(this.bets);
    this.currentBetsDataSource = new MatTableDataSource(this.currentBets());
    this.changeDetectorRef.detectChanges();
  }

  findBetIndexById(id: string): number {
    return this.bets.findIndex((bet) => bet.id === id);
  }

  setStatus(status): void {
    this.matSnackBar.open(status, null, {duration: 3000});
  }

  currentBets(): Bet[] {
    return this.bets.filter(bet => bet.winningNumber == null);
  }
}
