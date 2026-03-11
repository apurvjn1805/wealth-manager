import { Sip, Snapshot } from '../models/wealth.models';

export const SEED_SNAPSHOTS: Snapshot[] = [
  { label: "May '23", netWorth: 2630000, cash: 530000, debt: 1583000, equity: 332000, detail: { hdfc: 328047, icici: 201439, sbi: 0, food: 6184, mfInv: 331483, mfGain: 0, stocks: 0, epf: 400000, gold: 0, fd: 800000, mfDebt: 0, ppf: 382052, given: 0, avinake: 180000, misc: 0 } },
  { label: "Jan '24", netWorth: 3832000, cash: 522000, debt: 1972000, equity: 745000, detail: { hdfc: 500000, icici: 9546, sbi: 12000, food: 3300, mfInv: 580000, mfGain: 150000, stocks: 15000, epf: 555573, gold: 234000, fd: 800000, mfDebt: 0, ppf: 382052, given: 0, avinake: 350000, misc: 0 } },
  { label: "Jun '24", netWorth: 4362000, cash: 653000, debt: 1363000, equity: 954000, detail: { hdfc: 600000, icici: 47670, sbi: 5151, food: 3240, mfInv: 725463, mfGain: 200000, stocks: 28000, epf: 708834, gold: 234000, fd: 800000, mfDebt: 0, ppf: 419295, given: 200000, avinake: 350000, misc: 0 } },
  { label: "Jan '25", netWorth: 5365000, cash: 1076000, debt: 2329000, equity: 1398000, detail: { hdfc: 1005931, icici: 70000, sbi: 0, food: 7000, mfInv: 1029000, mfGain: 302916, stocks: 66000, epf: 875000, gold: 234000, fd: 800000, mfDebt: 0, ppf: 419295, given: 150000, avinake: 65000, misc: 0 } },
  { label: "May '25", netWorth: 5947000, cash: 597000, debt: 2458000, equity: 1641000, detail: { hdfc: 491796, icici: 38625, sbi: 66300, food: 1770, mfInv: 1250000, mfGain: 324212, stocks: 66000, epf: 987000, gold: 371000, fd: 900000, mfDebt: 350000, ppf: 450000, given: 185000, avinake: 125000, misc: 0 } },
  { label: "Aug '25", netWorth: 6632000, cash: 550000, debt: 2894000, equity: 1936000, detail: { hdfc: 393089, icici: 90179, sbi: 66300, food: 1770, mfInv: 1515000, mfGain: 354885, stocks: 66000, epf: 1150000, gold: 444000, fd: 900000, mfDebt: 550000, ppf: 450000, given: 185000, avinake: 125000, misc: 0 } },
  { label: "Nov '25", netWorth: 7391000, cash: 700000, debt: 3785000, equity: 2287000, detail: { hdfc: 560000, icici: 80000, sbi: 60000, food: 5367, mfInv: 1782000, mfGain: 340000, stocks: 165000, epf: 1219000, gold: 666000, fd: 900000, mfDebt: 550000, ppf: 450000, given: 141000, avinake: 125000, misc: 7000 } },
  { label: "Feb '26", netWorth: 8230000, cash: 872000, debt: 3815000, equity: 2978000, detail: { hdfc: 726000, icici: 113000, sbi: 33000, food: 2500, mfInv: 2044000, mfGain: 254000, stocks: 680000, epf: 1250000, gold: 765000, fd: 700000, mfDebt: 650000, ppf: 450000, given: 390000, avinake: 125000, misc: 47000 } },
];

export const SEED_SIPS: Sip[] = [
  { name: 'Mirae Equity', amt: 5000, day: 5, type: 'Equity MF', active: true },
  { name: 'Nifty Index', amt: 2000, day: 15, type: 'Index Fund', active: true },
];
