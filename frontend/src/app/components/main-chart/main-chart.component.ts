import { AfterViewInit, Component, ElementRef, HostListener, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { ChartMode, Snapshot } from '../../core/models/wealth.models';

@Component({
  selector: 'app-main-chart',
  standalone: true,
  template: `
    <div class="sec"><div class="sec-title">Net Worth Over Time</div><div class="sec-line"></div></div>
    <div class="card chart-card" style="margin-bottom:20px">
      <div class="tab-bar">
        <button class="tab-btn" [class.active]="mode === 'networth'" (click)="modeChange('networth')">Net Worth</button>
        <button class="tab-btn" [class.active]="mode === 'stacked'" (click)="modeChange('stacked')">Asset Layers</button>
        <button class="tab-btn" [class.active]="mode === 'growth'" (click)="modeChange('growth')">Growth %</button>
      </div>
      @if (mode === 'stacked') {
        <div class="layers-legend">
          <span><i class="lg-dot debt"></i>Debt</span>
          <span><i class="lg-dot equity"></i>Equity</span>
          <span><i class="lg-dot cash"></i>Cash</span>
        </div>
      }
      <canvas
        #canvas
        id="mainChart"
        height="240"
        (mousemove)="onMove($event)"
        (mouseleave)="onLeave()"
      ></canvas>
      @if (tooltipVisible) {
        <div class="chart-tip" [style.left.px]="tooltipX" [style.top.px]="tooltipY">
          <div>{{ tooltipLabel }}</div>
          <div>{{ tooltipValue }}</div>
        </div>
      }
    </div>
  `,
})
export class MainChartComponent implements AfterViewInit, OnChanges {
  @Input() snapshots: Snapshot[] = [];
  @Input() mode: ChartMode = 'networth';
  @Input() onModeChange: (mode: ChartMode) => void = () => { };
  @ViewChild('canvas') canvas?: ElementRef<HTMLCanvasElement>;
  private xPoints: number[] = [];
  private primaryVals: number[] = [];
  tooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;
  tooltipLabel = '';
  tooltipValue = '';

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(_: SimpleChanges): void {
    this.renderChart();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.renderChart();
  }

  modeChange(mode: ChartMode): void {
    this.onModeChange(mode);
    this.tooltipVisible = false;
  }

  onMove(event: MouseEvent): void {
    if (!this.canvas || this.xPoints.length === 0) return;
    const rect = this.canvas.nativeElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const nearest = this.xPoints.reduce((best, current, idx) => {
      const d = Math.abs(current - x);
      return d < best.distance ? { index: idx, distance: d } : best;
    }, { index: 0, distance: Number.POSITIVE_INFINITY });
    const i = nearest.index;
    const snapshot = this.snapshots[i];
    if (!snapshot) return;
    this.tooltipLabel = snapshot.label;
    this.tooltipValue = this.formatTooltipValue(this.primaryVals[i]);
    this.tooltipX = this.xPoints[i];
    this.tooltipY = 58;
    this.tooltipVisible = true;
  }

  onLeave(): void {
    this.tooltipVisible = false;
  }

  private renderChart(): void {
    if (!this.canvas || this.snapshots.length < 2) return;
    const canvas = this.canvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth || 900;
    const h = 240;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = { top: 20, right: 20, bottom: 36, left: 62 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    // We want to render chronologically (Oldest -> Newest) 
    // but the source array is Newest -> Oldest.
    const rawSnapshots = this.snapshots;
    const renderSnapshots = [...rawSnapshots].reverse();
    const n = renderSnapshots.length;

    const datasets = this.getDatasetsForRender(renderSnapshots);
    this.primaryVals = datasets[0]?.vals ?? [];
    const allV = datasets.flatMap((d: { vals: number[] }) => d.vals);
    const minV = Math.min(...allV) * (this.mode === 'growth' ? 1.4 : 0.9);
    const maxV = Math.max(...allV) * 1.05;
    const xP = (i: number) => pad.left + (i / (n - 1)) * cw;
    const yP = (v: number) => pad.top + ch - ((v - minV) / (maxV - minV || 1)) * ch;

    ctx.clearRect(0, 0, w, h);
    for (let i = 0; i <= 4; i += 1) {
      const y = pad.top + (ch / 4) * i;
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cw, y);
      ctx.stroke();
      const val = maxV - (maxV - minV) * (i / 4);
      ctx.fillStyle = '#555570';
      ctx.font = "10px 'DM Mono',monospace";
      ctx.textAlign = 'right';
      ctx.fillText(this.mode === 'growth' ? `${val.toFixed(1)}%` : `₹${val.toFixed(0)}L`, pad.left - 8, y + 4);
    }

    datasets.forEach((ds: { vals: number[]; color: string; fill: string }) => {
      ctx.beginPath();
      ctx.moveTo(xP(0), yP(ds.vals[0]));
      ds.vals.forEach((v: number, i: number) => { if (i > 0) ctx.lineTo(xP(i), yP(v)); });
      ctx.lineTo(xP(n - 1), pad.top + ch);
      ctx.lineTo(xP(0), pad.top + ch);
      ctx.closePath();
      ctx.fillStyle = ds.fill;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(xP(0), yP(ds.vals[0]));
      ds.vals.forEach((v: number, i: number) => { if (i > 0) ctx.lineTo(xP(i), yP(v)); });
      ctx.strokeStyle = ds.color;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });

    ctx.fillStyle = '#555570';
    ctx.font = "10px 'DM Mono',monospace";
    ctx.textAlign = 'center';
    renderSnapshots.forEach((s: Snapshot, i: number) => ctx.fillText(s.label, xP(i), h - 8));
    this.xPoints = renderSnapshots.map((_: Snapshot, i: number) => xP(i));
  }

  private getDatasetsForRender(snaps: Snapshot[]): { vals: number[]; color: string; fill: string }[] {
    if (this.mode === 'networth') {
      return [{ vals: snaps.map((s: Snapshot) => s.netWorth / 100000), color: '#c8f060', fill: 'rgba(200,240,96,0.06)' }];
    }
    if (this.mode === 'stacked') {
      return [
        { vals: snaps.map((s: Snapshot) => s.netWorth / 100000), color: '#f0c860', fill: 'rgba(240,200,96,0.12)' },
        { vals: snaps.map((s: Snapshot) => (s.equity + s.cash) / 100000), color: '#c8f060', fill: 'rgba(200,240,96,0.12)' },
        { vals: snaps.map((s: Snapshot) => s.cash / 100000), color: '#60f0c8', fill: 'rgba(96,240,200,0.12)' },
      ];
    }
    return [{
      vals: snaps.map((s: Snapshot, i: number) => (i === 0 ? 0 : Number((((s.netWorth - snaps[i - 1].netWorth) / snaps[i - 1].netWorth) * 100).toFixed(1)))),
      color: '#60c8f0',
      fill: 'rgba(96,200,240,0.06)',
    }];
  }

  private formatTooltipValue(v: number): string {
    if (this.mode === 'growth') {
      return `${v.toFixed(1)}%`;
    }
    return `₹${v.toFixed(2)}L`;
  }
}
