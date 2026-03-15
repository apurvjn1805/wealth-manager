import { computed, Injectable, signal } from '@angular/core';
import { SEED_SIPS, SEED_SNAPSHOTS } from '../data/seed.data';
import { Sip, Snapshot, SnapshotDetail } from '../models/wealth.models';
import { SheetsService } from './sheets.service';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class DataService {
  readonly snapshots = signal<Snapshot[]>([]);
  readonly sips = signal<Sip[]>([]);
  readonly syncStatus = signal('');
  readonly syncColor = signal('#666680');
  readonly lastSnapshot = computed(() => this.snapshots()[0] ?? null);

  constructor(
    private readonly sheetsService: SheetsService,
    private readonly toastService: ToastService,
  ) { }

  async loadData(): Promise<boolean> {
    const res = await this.sheetsService.read();
    if (!res.ok) {
      return false;
    }
    const data = await res.json();

    // New format already returns objects matching Snapshot interface
    const snapshots = (data.snapshots as any[] ?? []).filter((s: Snapshot) => s.label && s.netWorth > 0);
    const sips = (data.sips ?? [])
      .map((r: Record<string, string>) => mapSipRow(r))
      .filter((s: Sip) => !!s.name);

    this.snapshots.set(snapshots.length ? snapshots.reverse() : SEED_SNAPSHOTS.slice().reverse());
    console.log('Wealth Manager: Loaded snapshots', this.snapshots());
    this.sips.set(sips.length ? sips : SEED_SIPS);
    return true;
  }

  async saveSnapshot(snapshot: Snapshot): Promise<void> {
    this.snapshots.update((value) => [snapshot, ...value]);
    await this.writeWithStatus('Snapshots', snapshot);
  }

  async deleteSnapshot(index: number): Promise<void> {
    if (this.snapshots().length <= 1) {
      this.toastService.show("Can't delete the only snapshot", 'err');
      return;
    }
    this.snapshots.update((list) => list.filter((_, i) => i !== index));
    await this.writeWithStatus('deleteSnapshot', { snapshots: this.snapshots() });
  }

  async addSip(sip: Sip): Promise<void> {
    this.sips.update((value) => [...value, sip]);
    await this.writeWithStatus('SIPs', { sips: this.sips() });
  }

  async toggleSip(index: number): Promise<void> {
    this.sips.update((list) => list.map((sip, i) => (i === index ? { ...sip, active: !sip.active } : sip)));
    await this.writeWithStatus('SIPs', { sips: this.sips() });
  }

  async deleteSip(index: number): Promise<void> {
    this.sips.update((list) => list.filter((_, i) => i !== index));
    await this.writeWithStatus('SIPs', { sips: this.sips() });
  }

  private async writeWithStatus(tab: string, data: unknown): Promise<void> {
    this.syncStatus.set('● syncing...');
    this.syncColor.set('#60c8f0');
    const res = await this.sheetsService.write(tab, data);
    const json = await res.json();
    if (json.ok) {
      this.syncStatus.set('✓ synced');
      this.syncColor.set('#c8f060');
      setTimeout(() => this.syncStatus.set(''), 3000);
      return;
    }
    this.syncStatus.set('⚠ sync error');
    this.syncColor.set('#f06060');
    this.toastService.show(`Sync error: ${json.error ?? 'Write failed'}`, 'err');
  }
}

function mapSnapshotRow(r: Record<string, string>): Snapshot {
  const detail = {
    hdfc: toNum(r['hdfc']), icici: toNum(r['icici']), sbi: toNum(r['sbi']), food: toNum(r['food']),
    mfInv: toNum(r['mfInv']), mfGain: toNum(r['mfGain']), stocks: toNum(r['stocks']),
    epf: toNum(r['epf']), gold: toNum(r['gold']), fd: toNum(r['fd']), mfDebt: toNum(r['mfDebt']),
    ppf: toNum(r['ppf']), given: toNum(r['given']), avinake: toNum(r['avinake']), flatDeposit: toNum(r['flatDeposit']), misc: toNum(r['misc']),
  };
  return {
    label: r['label'],
    netWorth: toNum(r['netWorth']),
    cash: toNum(r['cash']),
    equity: toNum(r['equity']),
    debt: toNum(r['debt']),
    other: detail.given + detail.avinake + detail.misc,
    detail,
  };
}

function mapSipRow(r: Record<string, string>): Sip {
  return {
    name: r['name'] ?? '',
    amt: toNum(r['amt']),
    day: toNum(r['day']) || 1,
    type: r['type'] ?? '',
    active: r['active'] === 'TRUE',
  };
}

function toNum(v: unknown): number {
  return Number(v ?? 0) || 0;
}

export function buildSnapshot(label: string, detail: SnapshotDetail): Snapshot {
  const cash = detail.hdfc + detail.icici + detail.sbi + detail.food;
  const equity = detail.mfInv + detail.mfGain + detail.stocks;
  const debt = detail.epf + detail.gold + detail.fd + detail.mfDebt + detail.ppf + detail.flatDeposit;
  const others = detail.given + detail.avinake + detail.misc;
  return {
    label,
    cash,
    equity,
    debt,
    other: others,
    netWorth: cash + equity + debt + others,
    detail,
  };
}
