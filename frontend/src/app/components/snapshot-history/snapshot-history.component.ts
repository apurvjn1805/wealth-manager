import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Snapshot } from '../../core/models/wealth.models';
import { FormatCurrencyPipe } from '../../shared/pipes/format-currency.pipe';

@Component({
  selector: 'app-snapshot-history',
  standalone: true,
  imports: [FormatCurrencyPipe],
  template: `
    <div class="sec"><div class="sec-title">Snapshot History</div><div class="sec-line"></div><div class="sec-note">click × to delete</div></div>
    <div class="snap-chips">
      @for (snapshot of snapshots; track snapshot.label; let i = $index) {
        <div class="snap-chip">
          <div>
            <div style="font-size:11px;color:#c8f060;margin-bottom:2px">{{ snapshot.label }}</div>
            <div style="font-size:13px;font-family:'Syne',sans-serif;font-weight:700">{{ snapshot.netWorth | formatCurrency }}</div>
          </div>
          @if (snapshots.length > 1) {
            <button type="button" (click)="remove.emit(i)" style="background:none;border:none;color:#333350;font-size:13px;cursor:pointer">✕</button>
          }
        </div>
      }
    </div>
  `,
})
export class SnapshotHistoryComponent {
  @Input() snapshots: Snapshot[] = [];
  @Output() readonly remove = new EventEmitter<number>();
}
