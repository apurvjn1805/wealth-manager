import { Component, Input } from '@angular/core';
import { Snapshot } from '../../core/models/wealth.models';
import { FormatCurrencyPipe } from '../../shared/pipes/format-currency.pipe';

@Component({
  selector: 'app-hero-summary',
  standalone: true,
  imports: [FormatCurrencyPipe],
  template: `
    <div class="card hero" style="margin-bottom:20px">
      <div>
        <div class="hero-label">Net Worth</div>
        <div class="hero-val">{{ last?.netWorth | formatCurrency }}</div>
        @if (changeText) {
          <div class="pill">{{ changeText }}</div>
        }
      </div>
      <div>
        <div class="hero-label">Cash</div>
        <div class="stat-val" style="color:var(--cash)">{{ last?.cash | formatCurrency }}</div>
        <div class="stat-sub">{{ cashPct }}</div>
      </div>
      <div>
        <div class="hero-label">Equity</div>
        <div class="stat-val" style="color:var(--equity)">{{ last?.equity | formatCurrency }}</div>
        <div class="stat-sub">{{ equityPct }}</div>
      </div>
      <div>
        <div class="hero-label">Debt</div>
        <div class="stat-val" style="color:var(--debt)">{{ last?.debt | formatCurrency }}</div>
        <div class="stat-sub">{{ debtPct }}</div>
      </div>
    </div>
  `,
})
export class HeroSummaryComponent {
  @Input() last: Snapshot | null = null;
  @Input() previous: Snapshot | null = null;

  get cashPct(): string {
    if (!this.last?.netWorth) return '';
    return `${((this.last.cash / this.last.netWorth) * 100).toFixed(1)}% of portfolio`;
  }

  get equityPct(): string {
    if (!this.last?.netWorth) return '';
    return `${((this.last.equity / this.last.netWorth) * 100).toFixed(1)}% of portfolio`;
  }

  get debtPct(): string {
    if (!this.last?.netWorth) return '';
    return `${((this.last.debt / this.last.netWorth) * 100).toFixed(1)}% of portfolio`;
  }

  get changeText(): string {
    if (!this.last || !this.previous) return '';
    const pct = ((this.last.netWorth - this.previous.netWorth) / this.previous.netWorth) * 100;
    return `${pct >= 0 ? '↑ +' : '↓ '}${pct.toFixed(1)}% from ${this.previous.label}`;
  }
}
