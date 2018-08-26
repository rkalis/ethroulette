import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UtilModule } from '../util/util.module';
import { RouterModule } from '@angular/router';
import { RoulettePlayerComponent } from './roulette-player/roulette-player.component';
import {
  MatButtonModule,
  MatCardModule,
  MatFormFieldModule,
  MatInputModule,
  MatOptionModule,
  MatSelectModule,
  MatSnackBarModule,
  MatTableModule
} from '@angular/material';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BetHistoryComponent } from './bet-history/bet-history.component';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatOptionModule,
    MatSelectModule,
    MatTableModule,
    MatSnackBarModule,
    RouterModule,
    UtilModule
  ],
  declarations: [RoulettePlayerComponent, BetHistoryComponent],
  exports: [RoulettePlayerComponent, BetHistoryComponent]
})
export class RouletteModule {}
