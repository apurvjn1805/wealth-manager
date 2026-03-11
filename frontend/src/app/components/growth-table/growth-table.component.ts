import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Snapshot } from '../../core/models/wealth.models';
import { FormatCurrencyPipe } from '../../shared/pipes/format-currency.pipe';

@Component({
  selector: 'app-growth-table',
  standalone: true,
  imports: [FormatCurrencyPipe, DecimalPipe],
  template: `
    <div class="card" style="padding:0;overflow:hidden">
      <table>
        <thead><tr><th>Period</th><th>Net Worth</th><th>Change</th></tr></thead>
        <tbody>
          @for (snapshot of orderedSnapshots; track snapshot.label; let i = $index) {
            <tr>
              <td>{{ snapshot.label }}</td>
              <td>{{ snapshot.netWorth | formatCurrency }}</td>
              <td>
                @if (i === orderedSnapshots.length - 1) {
                  <span style="color:#444460">—</span>
                } @else {
                  <span class="badge" [class.up]="change(snapshot.netWorth, orderedSnapshots[i + 1].netWorth) >= 0" [class.dn]="change(snapshot.netWorth, orderedSnapshots[i + 1].netWorth) < 0">
                    {{ change(snapshot.netWorth, orderedSnapshots[i + 1].netWorth) >= 0 ? '+' : '' }}{{ change(snapshot.netWorth, orderedSnapshots[i + 1].netWorth) | number:'1.1-1' }}%
                  </span>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class GrowthTableComponent {
  @Input() snapshots: Snapshot[] = [];
  get orderedSnapshots(): Snapshot[] {
    return [...this.snapshots].reverse();
  }

  change(current: number, previous: number): number {
    return ((current - previous) / previous) * 100;
  }
}
