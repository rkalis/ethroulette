import { StatusService } from './status.service';
import { AccountService } from '../core/account.service';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Web3Service } from '../core/web3.service';

@NgModule({
  imports: [
    CommonModule
  ],
  providers: [
    Web3Service,
    AccountService,
    StatusService
  ],
  declarations: []
})
export class SharedModule {
}
