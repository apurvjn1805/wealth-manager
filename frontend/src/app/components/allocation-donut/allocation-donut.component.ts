import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { Snapshot } from '../../core/models/wealth.models';

@Component({
  selector: 'app-allocation-donut',
  standalone: true,
  template: `
    <div class="card">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:20px">Allocation</div>
      <div style="display:flex;gap:24px;align-items:center">
        <canvas #donut id="donut" width="160" height="160" style="width:160px;height:160px;flex-shrink:0"></canvas>
        <div style="display:flex;flex-direction:column;gap:12px">
          @for (item of legend; track item.label) {
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:9px;height:9px;border-radius:2px;flex-shrink:0" [style.background]="item.color"></div>
              <span style="font-size:11px;color:var(--muted)">{{ item.label }}</span>
              <span style="margin-left:auto;font-size:12px;color:var(--text)">{{ item.pct }}%</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AllocationDonutComponent implements AfterViewInit, OnChanges {
  @Input() snapshot: Snapshot | null = null;
  @ViewChild('donut') canvas?: ElementRef<HTMLCanvasElement>;
  legend: { label: string; color: string; pct: string }[] = [];

  ngAfterViewInit(): void {
    this.render();
  }

  ngOnChanges(): void {
    this.render();
  }

  private render(): void {
    if (!this.snapshot || !this.canvas) return;
    const ctx = this.canvas.nativeElement.getContext('2d');
    if (!ctx) return;
    const s = this.snapshot;
    const total = s.cash + s.equity + s.debt || 1;
    const segs = [
      { v: s.debt, c: 'rgba(240,200,96,0.85)' },
      { v: s.equity, c: 'rgba(200,240,96,0.85)' },
      { v: s.cash, c: 'rgba(96,240,200,0.85)' },
    ];
    const size = 160;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.nativeElement.width = size * dpr;
    this.canvas.nativeElement.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2;
    const cy = size / 2;
    const r = 62;
    const ir = 44;
    let angle = -Math.PI / 2;
    segs.forEach((seg) => {
      const sw = (seg.v / total) * Math.PI * 2;
      if (sw <= 0) return;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle, angle + sw);
      ctx.closePath();
      ctx.fillStyle = seg.c;
      ctx.fill();
      angle += sw;
    });
    ctx.beginPath();
    ctx.arc(cx, cy, ir, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--surface').trim() || '#111118';
    ctx.fill();

    this.legend = [
      { label: 'Debt', color: '#f0c860', pct: ((s.debt / total) * 100).toFixed(1) },
      { label: 'Equity', color: '#c8f060', pct: ((s.equity / total) * 100).toFixed(1) },
      { label: 'Cash', color: '#60f0c8', pct: ((s.cash / total) * 100).toFixed(1) },
    ];
  }
}
