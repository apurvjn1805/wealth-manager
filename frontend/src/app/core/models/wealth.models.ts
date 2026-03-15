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
  flatDeposit: number;
  misc: number;
}

export interface Snapshot {
  label: string;
  netWorth: number;
  cash: number;
  equity: number;
  debt: number;
  other: number;
  detail: SnapshotDetail;
}

export interface Sip {
  name: string;
  amt: number;
  day: number;
  type: string;
  active: boolean;
}

export interface Goal {
  name: string;
  target: number;
  current: number;
  deadline?: string;
}

export type ChartMode = 'networth' | 'stacked' | 'growth';
