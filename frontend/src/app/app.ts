import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { DashboardHeaderComponent } from './components/dashboard-header/dashboard-header.component';
import { HeroSummaryComponent } from './components/hero-summary/hero-summary.component';
import { MainChartComponent } from './components/main-chart/main-chart.component';
import { AllocationDonutComponent } from './components/allocation-donut/allocation-donut.component';
import { GrowthTableComponent } from './components/growth-table/growth-table.component';
import { AssetBreakdownComponent } from './components/asset-breakdown/asset-breakdown.component';
import { SnapshotFormComponent } from './components/snapshot-form/snapshot-form.component';
import { SipTrackerComponent } from './components/sip-tracker/sip-tracker.component';
import { SnapshotHistoryComponent } from './components/snapshot-history/snapshot-history.component';
import { LoadingBarComponent } from './components/loading-bar/loading-bar.component';
import { ToastComponent } from './components/toast/toast.component';
import { LoginOverlayComponent } from './components/login-overlay/login-overlay.component';
import { AuthService } from './core/services/auth.service';
import { DataService } from './core/services/data.service';
import { LoadingService } from './core/services/loading.service';
import { ToastService } from './core/services/toast.service';
import { ChartMode, Sip, Snapshot } from './core/models/wealth.models';

@Component({
  selector: 'app-root',
  imports: [
    DashboardHeaderComponent,
    HeroSummaryComponent,
    MainChartComponent,
    AllocationDonutComponent,
    GrowthTableComponent,
    AssetBreakdownComponent,
    SnapshotFormComponent,
    SipTrackerComponent,
    SnapshotHistoryComponent,
    LoadingBarComponent,
    ToastComponent,
    LoginOverlayComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  @ViewChild(LoginOverlayComponent) loginOverlay?: LoginOverlayComponent;
  protected readonly auth = inject(AuthService);
  protected readonly data = inject(DataService);
  private readonly loading = inject(LoadingService);
  private readonly toast = inject(ToastService);

  protected readonly chartMode = signal<ChartMode>('networth');
  protected readonly entryTab = signal<'snapshot' | 'sip'>('snapshot');
  protected readonly theme = signal<'dark' | 'light'>('dark');
  protected readonly pendingDelete = signal<{ type: 'sip' | 'snapshot'; index: number } | null>(null);
  protected readonly lastUpdated = computed(() => `Last updated: ${this.data.lastSnapshot()?.label ?? '—'}`);
  protected readonly previousSnapshot = computed(() => {
    const snapshots = this.data.snapshots();
    return snapshots.length > 1 ? snapshots[snapshots.length - 2] : null;
  });

  protected async doLogin(credentials: { user: string; pass: string }): Promise<void> {
    this.auth.setCredentials(credentials.user, credentials.pass);
    this.loading.set(30);
    try {
      const loaded = await this.data.loadData();
      if (!loaded) {
        this.loginOverlay?.setError('Wrong username or password');
        this.auth.clearCredentials();
        this.loading.set(100);
        return;
      }
      this.auth.markLoggedIn();
      this.loading.set(100);
    } catch {
      this.loginOverlay?.setError('Connection error — try again');
      this.loading.set(100);
    }
  }

  protected setChartMode(mode: ChartMode): void {
    this.chartMode.set(mode);
  }

  protected setEntryTab(tab: 'snapshot' | 'sip'): void {
    this.entryTab.set(tab);
  }

  protected async saveSnapshot(snapshot: Snapshot): Promise<void> {
    if (!snapshot.label) {
      this.toast.show('Enter a snapshot label', 'err');
      return;
    }
    if (snapshot.netWorth === 0) {
      this.toast.show('Enter at least one asset value', 'err');
      return;
    }
    await this.data.saveSnapshot(snapshot);
    this.toast.show('✓ Snapshot saved to Google Sheets!');
  }

  protected toggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    document.body.classList.toggle('theme-light', next === 'light');
  }

  protected async addSip(sip: Sip): Promise<void> {
    if (!sip.name || sip.amt <= 0) {
      this.toast.show('Enter fund name and amount', 'err');
      return;
    }
    await this.data.addSip(sip);
    this.toast.show('✓ SIP saved!');
  }

  private async deleteSip(index: number): Promise<void> {
    await this.data.deleteSip(index);
    this.toast.show('SIP deleted');
  }

  private async deleteSnapshot(index: number): Promise<void> {
    await this.data.deleteSnapshot(index);
    this.toast.show('Snapshot deleted');
  }

  protected requestDeleteSip(index: number): void {
    this.pendingDelete.set({ type: 'sip', index });
  }

  protected requestDeleteSnapshot(index: number): void {
    this.pendingDelete.set({ type: 'snapshot', index });
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected async confirmDelete(): Promise<void> {
    const pending = this.pendingDelete();
    if (!pending) return;
    if (pending.type === 'sip') {
      await this.deleteSip(pending.index);
    } else {
      await this.deleteSnapshot(pending.index);
    }
    this.pendingDelete.set(null);
  }
}
