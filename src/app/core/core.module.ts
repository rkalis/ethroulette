import { AccountService } from './account.service';
import { Web3Service } from './web3.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContractService } from './contract.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  providers: [
    Web3Service,
    AccountService,
    ContractService
  ]
})
export class CoreModule { }
