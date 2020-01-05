import { ContractService } from './../../core/contract.service';
import { StatusService } from './../../shared/status.service';
import { AccountService } from '../../core/account.service';
import { Component, OnInit} from '@angular/core';
import { Web3Service } from '../../core/web3.service';

@Component({
  selector: 'app-roulette-player',
  templateUrl: './roulette-player.component.html',
  styleUrls: ['./roulette-player.component.css']
})
export class RoulettePlayerComponent implements OnInit {
  maxBet: string;

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
      await this.updateMaxBet()
      setInterval(() => this.updateMaxBet(), 1000);
    } catch (error) {
      console.log(error);
      this.statusService.showStatus('Error connecting with smart contracts; see log.');
    }
  }

  async bet(number: number, betSize: number) {
    const deployedRoulette = this.contractService.getDeployedContract('Roulette');
    if (!deployedRoulette) {
      this.statusService.showStatus('Roulette contract is not available');
      return;
    }

    const betSizeInWei = this.web3Service.toWei(betSize, 'ether');
    console.log('Betting ' + betSize + ' on number ' + number);

    this.statusService.showStatus('Initiating transaction... (please wait)');

    try {
      const tx = await deployedRoulette.bet(number, {from: this.accountService.account, value: betSizeInWei});

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

  async updateMaxBet() {
    const deployedRoulette = this.contractService.getDeployedContract('Roulette');
    if (!deployedRoulette) {
      this.statusService.showStatus('Roulette contract is not available');
      return;
    }

    const maxBetStr = this.web3Service.fromWei(await deployedRoulette.maxBet(), 'ether');
    this.maxBet = (Math.floor(Number(maxBetStr) * 1000) / 1000).toFixed(3);
  }
}
