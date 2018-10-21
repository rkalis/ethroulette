import { Component } from '@angular/core';
import { AccountService } from '../../core/account.service';

@Component({
  selector: 'app-account-selector',
  templateUrl: './account-selector.component.html',
  styleUrls: ['./account-selector.component.css']
})
export class AccountSelectorComponent {
  constructor(
    public accountService: AccountService
  ) {
    console.log(this);
  }
}
