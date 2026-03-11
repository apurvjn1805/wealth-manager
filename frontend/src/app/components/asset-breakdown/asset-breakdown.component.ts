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
        <div class="bk-title" style="color:var(--cash)">Cash & Savings</div>
        @for (row of cashRows; track row.name) {
          <div class="bk-row">
            <div class="bk-name">{{ row.name }}</div>
            <div class="bk-bar-wrap"><div class="bk-bar" [style.width.%]="pct(row.value, cashTotal)" [style.background]="'var(--cash)'"></div></div>
            <div class="bk-amt">{{ row.value | formatCurrency }}</div>
          </div>
        }
      </div>
      <div class="card">
        <div class="bk-title" style="color:var(--equity)">Equity</div>
        @for (row of equityRows; track row.name) {
          <div class="bk-row">
            <div class="bk-name">{{ row.name }}</div>
            <div class="bk-bar-wrap"><div class="bk-bar" [style.width.%]="pct(row.value, equityTotal)" [style.background]="'var(--equity)'"></div></div>
            <div class="bk-amt">{{ row.value | formatCurrency }}</div>
          </div>
        }
      </div>
      <div class="card">
        <div class="bk-title" style="color:var(--debt)">Debt & Fixed</div>
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
  @Input() snapshot: Snapshot | null = null;

  get cashRows(): Row[] {
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
      { name: 'PPF', value: d.ppf }, { name: 'Given', value: d.given }, { name: 'Avinake', value: d.avinake }, { name: 'Misc', value: d.misc },
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
