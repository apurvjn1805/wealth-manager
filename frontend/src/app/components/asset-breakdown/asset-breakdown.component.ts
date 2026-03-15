import { Component, Input } from '@angular/core';
import { Snapshot } from '../../core/models/wealth.models';
import { FormatCurrencyPipe } from '../../shared/pipes/format-currency.pipe';

@Component({
  selector: 'app-asset-breakdown',
  standalone: true,
  imports: [FormatCurrencyPipe],
  template: `
    <div class="sec"><div class="sec-title">Asset Breakdown</div><div class="sec-line"></div><div class="sec-note">latest snapshot</div></div>
    <div class="bk-grid">
      <div class="card">
        <div class="bk-title" style="color:var(--cash)">Cash & Savings <span style="float:right;font-size:12px;color:var(--text);text-transform:none;font-family:'Syne',sans-serif;font-weight:700">{{ cashTotal | formatCurrency }}</span></div>
        @for (row of cashRows; track row.name) {
          <div class="bk-row">
            <div class="bk-name">{{ row.name }}</div>
            <div class="bk-bar-wrap"><div class="bk-bar" [style.width.%]="pct(row.value, cashTotal)" [style.background]="'var(--cash)'"></div></div>
            <div class="bk-amt">{{ row.value | formatCurrency }}</div>
          </div>
        }
      </div>
      <div class="card">
        <div class="bk-title" style="color:var(--equity)">Equity <span style="float:right;font-size:12px;color:var(--text);text-transform:none;font-family:'Syne',sans-serif;font-weight:700">{{ equityTotal | formatCurrency }}</span></div>
        @for (row of equityRows; track row.name) {
          <div class="bk-row">
            <div class="bk-name">{{ row.name }}</div>
            <div class="bk-bar-wrap"><div class="bk-bar" [style.width.%]="pct(row.value, equityTotal)" [style.background]="'var(--equity)'"></div></div>
            <div class="bk-amt">{{ row.value | formatCurrency }}</div>
          </div>
        }
      </div>
      <div class="card">
        <div class="bk-title" style="color:var(--debt)">Debt & Fixed <span style="float:right;font-size:12px;color:var(--text);text-transform:none;font-family:'Syne',sans-serif;font-weight:700">{{ debtTotal | formatCurrency }}</span></div>
        @for (row of debtRows; track row.name) {
          <div class="bk-row">
            <div class="bk-name">{{ row.name }}</div>
            <div class="bk-bar-wrap"><div class="bk-bar" [style.width.%]="pct(row.value, debtTotal)" [style.background]="'var(--debt)'"></div></div>
            <div class="bk-amt">{{ row.value | formatCurrency }}</div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AssetBreakdownComponent {
  private _snapshot: Snapshot | null = null;
  @Input() set snapshot(v: Snapshot | null) {
    this._snapshot = v;
    if (v) console.log('AssetBreakdown: snapshot updated', v.label, v.detail);
  }
  get snapshot() { return this._snapshot; }

  get cashRows(): Row[] {
    console.log('this.snapshot?.detail: ', this.snapshot?.detail);
    const d = this.snapshot?.detail;
    if (!d) return [];
    return rows([{ name: 'HDFC', value: d.hdfc }, { name: 'ICICI', value: d.icici }, { name: 'SBI', value: d.sbi }, { name: 'Food Wallet', value: d.food }]);
  }

  get equityRows(): Row[] {
    const d = this.snapshot?.detail;
    if (!d) return [];
    return rows([{ name: 'MF Equity', value: d.mfInv }, { name: 'MF Gains', value: d.mfGain }, { name: 'Stocks', value: d.stocks }]);
  }

  get debtRows(): Row[] {
    const d = this.snapshot?.detail;
    if (!d) return [];
    return rows([
      { name: 'EPF', value: d.epf }, { name: 'Gold', value: d.gold }, { name: 'FD', value: d.fd }, { name: 'MF Debt', value: d.mfDebt },
      { name: 'PPF', value: d.ppf }, { name: 'Given', value: d.given }, { name: 'Flat Deposit', value: d.flatDeposit }, { name: 'Misc', value: d.misc }, { name: 'Avinake', value: d.avinake },
    ]);
  }

  get cashTotal(): number { return this.cashRows.reduce((a, b) => a + b.value, 0) || 1; }
  get equityTotal(): number { return this.equityRows.reduce((a, b) => a + b.value, 0) || 1; }
  get debtTotal(): number { return this.debtRows.reduce((a, b) => a + b.value, 0) || 1; }

  pct(value: number, total: number): number {
    return Number(((value / total) * 100).toFixed(0));
  }
}

interface Row {
  name: string;
  value: number;
}

function rows(input: Row[]): Row[] {
  return input.filter((row) => row.value > 0);
}
