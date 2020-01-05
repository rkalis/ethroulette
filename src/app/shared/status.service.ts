import { MatSnackBar } from '@angular/material/snack-bar';
import { Injectable } from '@angular/core';


@Injectable()
export class StatusService {
  public statusHistory: string[] = [];
  constructor(
    private matSnackBar: MatSnackBar
  ) {
    console.log(this);
  }

  showStatus(msg: string, duration: number = 3000) {
    this.matSnackBar.open(msg, null, {duration: duration});
    this.statusHistory.push(msg);
  }
}
