import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Snapshot, SnapshotDetail } from '../../core/models/wealth.models';
import { buildSnapshot } from '../../core/services/data.service';
import { FormatCurrencyPipe } from '../../shared/pipes/format-currency.pipe';

@Component({
  selector: 'app-snapshot-form',
  standalone: true,
  imports: [FormsModule, FormatCurrencyPipe],
  template: `
    <div class="fdivider" style="margin-top:0">Snapshot Label</div>
    <input class="finp" type="text" placeholder="e.g. Aug '26" style="width:220px" [(ngModel)]="label" />

    <div class="fdivider"><span style="color:var(--cash)">●</span> Cash & Savings</div>
    <div class="fgrid">
      @for (field of cashFields; track field.key) { <div><label class="flabel">{{ field.label }}</label><input class="finp c" type="number" [(ngModel)]="detail[field.key]" /></div> }
    </div>

    <div class="fdivider"><span style="color:var(--equity)">●</span> Equity</div>
    <div class="fgrid">
      @for (field of equityFields; track field.key) { <div><label class="flabel">{{ field.label }}</label><input class="finp e" type="number" [(ngModel)]="detail[field.key]" /></div> }
    </div>

    <div class="fdivider"><span style="color:var(--debt)">●</span> Debt & Fixed</div>
    <div class="fgrid">
      @for (field of debtFields; track field.key) { <div><label class="flabel">{{ field.label }}</label><input class="finp d" type="number" [(ngModel)]="detail[field.key]" /></div> }
    </div>

    <div class="preview">
      <div><div class="prev-label">Net Worth</div><div class="prev-val" [class.live]="netWorth > 0">{{ netWorth ? (netWorth | formatCurrency) : '—' }}</div></div>
      <div><div class="prev-label">Cash</div><div class="prev-val" [class.live]="cash > 0">{{ cash ? (cash | formatCurrency) : '—' }}</div></div>
      <div><div class="prev-label">Equity</div><div class="prev-val" [class.live]="equity > 0">{{ equity ? (equity | formatCurrency) : '—' }}</div></div>
      <div><div class="prev-label">Debt</div><div class="prev-val" [class.live]="debt > 0">{{ debt ? (debt | formatCurrency) : '—' }}</div></div>
      <div><div class="prev-label">vs Last</div><div class="prev-val" [class.live]="delta !== null" [style.color]="deltaColor">{{ deltaText }}</div></div>
    </div>

    <div class="action-row">
      <button class="btn-primary" type="button" (click)="save.emit(makeSnapshot())">→ Save to Sheets</button>
      <button class="btn-sec" type="button" (click)="clear()">Clear</button>
    </div>
  `,
})
export class SnapshotFormComponent {
  @Input() lastSnapshot: Snapshot | null = null;
  @Output() readonly save = new EventEmitter<Snapshot>();
  label = '';
  detail: SnapshotDetail = emptyDetail();

  readonly cashFields = [
    { key: 'hdfc', label: 'HDFC (₹)' }, { key: 'icici', label: 'ICICI (₹)' }, { key: 'sbi', label: 'SBI (₹)' }, { key: 'food', label: 'Food Wallet (₹)' },
  ] as const;
  readonly equityFields = [
    { key: 'mfInv', label: 'MF Invested (₹)' }, { key: 'mfGain', label: 'MF Gains (₹)' }, { key: 'stocks', label: 'Stocks (₹)' },
  ] as const;
  readonly debtFields = [
    { key: 'epf', label: 'EPF (₹)' }, { key: 'gold', label: 'Gold (₹)' }, { key: 'fd', label: 'FD (₹)' }, { key: 'mfDebt', label: 'MF Debt (₹)' },
    { key: 'ppf', label: 'PPF (₹)' }, { key: 'given', label: 'Given/Santosh (₹)' }, { key: 'flatDeposit', label: 'Flat Deposit (₹)' },
    { key: 'misc', label: 'Misc (₹)' }, { key: 'avinake', label: 'Avinake (₹)' },
  ] as const;

  get cash(): number { return this.detail.hdfc + this.detail.icici + this.detail.sbi + this.detail.food; }
  get equity(): number { return this.detail.mfInv + this.detail.mfGain + this.detail.stocks; }
  get debt(): number { return this.detail.epf + this.detail.gold + this.detail.fd + this.detail.mfDebt + this.detail.ppf + this.detail.given + this.detail.flatDeposit + this.detail.misc + this.detail.avinake; }
  get netWorth(): number { return this.cash + this.equity + this.debt; }

  get delta(): number | null {
    if (!this.lastSnapshot || !this.netWorth) return null;
    return ((this.netWorth - this.lastSnapshot.netWorth) / this.lastSnapshot.netWorth) * 100;
  }
  get deltaText(): string { return this.delta === null ? '—' : `${this.delta >= 0 ? '+' : ''}${this.delta.toFixed(1)}%`; }
  get deltaColor(): string { return this.delta === null ? '#444460' : this.delta >= 0 ? '#c8f060' : '#f06060'; }

  makeSnapshot(): Snapshot {
    return buildSnapshot(this.label.trim(), this.detail);
  }

  clear(): void {
    this.label = '';
    this.detail = emptyDetail();
  }
}

function emptyDetail(): SnapshotDetail {
  return {
    hdfc: 0, icici: 0, sbi: 0, food: 0, mfInv: 0, mfGain: 0, stocks: 0,
    epf: 0, gold: 0, fd: 0, mfDebt: 0, ppf: 0, given: 0, avinake: 0, flatDeposit: 0, misc: 0,
  };
}
