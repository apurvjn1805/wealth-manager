import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Sip } from '../../core/models/wealth.models';

@Component({
  selector: 'app-sip-tracker',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div style="font-size:12px;color:var(--muted);margin-bottom:18px">Monthly SIPs — changes sync to Google Sheets instantly.</div>
    @if (sips.length === 0) {
      <div style="font-size:12px;color:#444460;padding:12px 0">No SIPs yet.</div>
    } @else {
      @for (sip of sips; track sip.name + sip.day; let i = $index) {
        <div class="sip-row">
          <div style="font-size:12px">{{ sip.name }} <span style="font-size:10px;color:#666680;margin-left:6px">{{ sip.type }}</span></div>
          <div style="font-size:12px;color:var(--equity)">₹{{ sip.amt.toLocaleString('en-IN') }}/mo</div>
          <div style="font-size:11px;color:#666680">on {{ sip.day }}th</div>
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:7px;height:7px;border-radius:50%" [style.background]="sip.active ? '#c8f060' : '#444460'"></div>
            <span style="font-size:10px" [style.color]="sip.active ? '#c8f060' : '#666680'">{{ sip.active ? 'Active' : 'Paused' }}</span>
            <button type="button" (click)="toggle.emit(i)" style="background:none;border:none;font-size:10px;color:#444460;font-family:'DM Mono',monospace;cursor:pointer">{{ sip.active ? 'pause' : 'resume' }}</button>
          </div>
          <button type="button" (click)="remove.emit(i)" style="background:none;border:none;color:#333350;font-size:13px;cursor:pointer">✕</button>
        </div>
      }
    }

    <div class="fdivider">Add New SIP</div>
    <div class="sip-add">
      <div><label class="flabel">Fund Name</label><input class="finp e" type="text" [(ngModel)]="name" /></div>
      <div><label class="flabel">Monthly (₹)</label><input class="finp e" type="number" [(ngModel)]="amt" /></div>
      <div>
        <label class="flabel">SIP Date</label>
        <select class="finp e" [(ngModel)]="day">
          @for (d of days; track d) { <option [value]="d">{{ d }}</option> }
        </select>
      </div>
      <div>
        <label class="flabel">Type</label>
        <select class="finp e" [(ngModel)]="type">
          <option>Equity MF</option><option>Debt MF</option><option>Index Fund</option><option>ELSS</option><option>Stocks</option><option>Other</option>
        </select>
      </div>
      <div><label class="flabel" style="opacity:0">_</label><button class="btn-primary" type="button" (click)="add()">+ Add</button></div>
    </div>

    <div class="sip-summary">
      <div class="sip-card"><div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Monthly Total</div><div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:var(--equity)">₹{{ monthly.toLocaleString('en-IN') }}</div></div>
      <div class="sip-card"><div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Yearly</div><div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:var(--equity)">₹{{ (monthly * 12).toLocaleString('en-IN') }}</div></div>
      <div class="sip-card"><div style="font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:4px">Active SIPs</div><div style="font-family:'Syne',sans-serif;font-size:20px;font-weight:700;color:var(--cash)">{{ activeCount }}</div></div>
    </div>
  `,
})
export class SipTrackerComponent {
  @Input() sips: Sip[] = [];
  @Output() readonly addSip = new EventEmitter<Sip>();
  @Output() readonly toggle = new EventEmitter<number>();
  @Output() readonly remove = new EventEmitter<number>();

  name = '';
  amt = 0;
  day = 1;
  type = 'Equity MF';
  readonly days = Array.from({ length: 28 }, (_, i) => i + 1);

  get monthly(): number {
    return this.sips.filter((sip) => sip.active).reduce((sum, sip) => sum + sip.amt, 0);
  }

  get activeCount(): number {
    return this.sips.filter((sip) => sip.active).length;
  }

  add(): void {
    if (!this.name.trim() || this.amt <= 0) {
      return;
    }
    this.addSip.emit({
      name: this.name.trim(),
      amt: Number(this.amt),
      day: Number(this.day),
      type: this.type,
      active: true,
    });
    this.name = '';
    this.amt = 0;
  }
}
