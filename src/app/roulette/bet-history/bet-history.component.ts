import { ContractService } from './../../core/contract.service';
import { StatusService } from './../../shared/status.service';
import { AccountService } from '../../core/account.service';
import { Subject } from 'rxjs/Rx';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Web3Service } from '../../core/web3.service';
import { MatTableDataSource } from '@angular/material';

export class Bet {
  id: string;
  blockNumber: number;
  betSize: number;
  betNumber: number;
  winningNumber: number;
  payout: number;

  constructor(
    id: string,
    blockNumber: number,
    betSize: number,
    betNumber: number,
    winningNumber: number,
    payout: number
  ) {
    this.id = id;
    this.blockNumber = blockNumber;
    this.betSize = betSize;
    this.betNumber = betNumber;
    this.winningNumber = winningNumber;
    this.payout = payout;
  }
}
@Component({
  selector: 'app-bet-history',
  templateUrl: './bet-history.component.html',
  styleUrls: ['./bet-history.component.css']
})
export class BetHistoryComponent implements OnInit {
  betsDataSource: MatTableDataSource<Bet>;
  currentBetsDataSource: MatTableDataSource<Bet>;
  bets: Bet[] = [];

  constructor(
    private web3Service: Web3Service,
    private contractService: ContractService,
    private accountService: AccountService,
    private statusService: StatusService,
    private changeDetectorRef: ChangeDetectorRef
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
    } catch (error) {
      console.log(error);
      this.statusService.showStatus('Error connecting with smart contracts; see log.');
    }
  }

  watchAccount() {
    this.accountService.accountObservable.subscribe((account) => {
      const betEvent = this.contractService.newEvent('Roulette', 'Bet', {player: account});
      const playEvent = this.contractService.newEvent('Roulette', 'Play', {player: account});
      const payoutEvent = this.contractService.newEvent('Roulette', 'Payout', {player: account});

      betEvent.get(this.initialiseBets);
      betEvent.watch(this.addBet);

      playEvent.get(this.initialiseBets);
      playEvent.watch(this.addBet);

      payoutEvent.get(this.initialiseBets);
      payoutEvent.watch(this.addBet);
    });
  }

  initialiseBets = async (error, bets) => {
    if (error != null) {
      console.warn('There was an error fetching your bets.');
      return;
    }

    for (const bet of bets) {
      const betSize = bet.args.betSize == null ? null : this.web3Service.fromWei(bet.args.betSize, 'ether');
      const payout = bet.args.payout == null ? null : this.web3Service.fromWei(bet.args.payout, 'ether');
      this.addOrUpdate(new Bet(bet.args.qid, bet.blockNumber, betSize, bet.args.betNumber, bet.args.winningNumber, payout));
    }
  }

  addBet = async (error, bet) => {
    if (error != null) {
      console.warn('There was an error fetching your bets.');
      return;
    }
    const betSize = bet.args.betSize == null ? null : this.web3Service.fromWei(bet.args.betSize, 'ether');
    const payout = bet.args.payout == null ? null : this.web3Service.fromWei(bet.args.payout, 'ether');
    this.addOrUpdate(new Bet(bet.args.qid, bet.blockNumber, betSize, bet.args.betNumber, bet.args.winningNumber, payout));
  }

  addOrUpdate(bet: Bet) {
    const index = this.findBetIndexById(bet.id);
    if (index > -1) {
      if (this.bets[index].blockNumber > bet.blockNumber) {
        this.bets[index].blockNumber = bet.blockNumber;
        console.log('Updated blockNumber for bet ', bet.id, ' to ', bet.blockNumber);
      }
      if (this.bets[index].betSize == null && bet.betSize != null) {
        this.bets[index].betSize = bet.betSize;
        console.log('Updated betSize for bet ', bet.id, ' to ', bet.betSize);
      }
      if (this.bets[index].betNumber == null && bet.betNumber != null) {
        this.bets[index].betNumber = bet.betNumber;
        console.log('Updated betNumber for bet ', bet.id, ' to ', bet.betNumber);
      }
      if (this.bets[index].winningNumber == null && bet.winningNumber != null) {
        this.bets[index].winningNumber = bet.winningNumber;
        console.log('Updated winningNumber for bet ', bet.id, ' to ', bet.winningNumber);
      }
      if (this.bets[index].payout == null && bet.payout != null) {
        this.bets[index].payout = bet.payout;
        console.log('Updated payout for bet ', bet.id, ' to ', bet.payout);
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

  currentBets(): Bet[] {
    return this.bets.filter(bet => bet.winningNumber == null);
  }
}
