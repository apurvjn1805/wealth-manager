import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  template: `
    <header style="margin-bottom:36px">
      <div class="tag">Personal Finance Dashboard</div>
      <h1>Wealth <span>Tracker</span></h1>
      <div class="sub">
        <span>{{ lastUpdated }}</span>
        <span [style.color]="syncColor">{{ syncStatus }}</span>
      </div>
    </header>
  `,
})
export class DashboardHeaderComponent {
  @Input() lastUpdated = 'Last updated: —';
  @Input() syncStatus = '';
  @Input() syncColor = '#666680';
}
