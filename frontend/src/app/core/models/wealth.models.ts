export interface SnapshotDetail {
  hdfc: number;
  icici: number;
  sbi: number;
  food: number;
  mfInv: number;
  mfGain: number;
  stocks: number;
  epf: number;
  gold: number;
  fd: number;
  mfDebt: number;
  ppf: number;
  given: number;
  avinake: number;
  misc: number;
}

export interface Snapshot {
  label: string;
  netWorth: number;
  cash: number;
  equity: number;
  debt: number;
  detail: SnapshotDetail;
}

export interface Sip {
  name: string;
  amt: number;
  day: number;
  type: string;
  active: boolean;
}

export type ChartMode = 'networth' | 'stacked' | 'growth';
