import { AfterViewInit, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { Snapshot } from '../../core/models/wealth.models';
import { FormatCurrencyPipe } from '../../shared/pipes/format-currency.pipe';

@Component({
  selector: 'app-allocation-donut',
  standalone: true,
  imports: [FormatCurrencyPipe],
  template: `
    <div class="card">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:20px">Allocation</div>
      <div class="donut-wrap" style="display:flex;gap:32px;align-items:center;flex-wrap:wrap">
        <canvas #donut id="donut" width="160" height="160" style="width:160px;height:160px;flex-shrink:0"></canvas>
        <div style="display:flex;flex-direction:column;gap:12px;min-width:140px">
          @for (item of legend; track item.label) {
            <div style="display:flex;align-items:center;gap:8px">
              <div style="width:9px;height:9px;border-radius:2px;flex-shrink:0" [style.background]="item.color"></div>
              <span style="font-size:11px;color:var(--muted)">{{ item.label }}</span>
              <span style="margin-left:auto;font-size:12px;color:var(--text)">{{ item.pct }}%</span>
            </div>
          }
        </div>

        <!-- Extra Right Info -->
        <div style="display:flex;flex-direction:column;gap:16px;margin-left:auto;padding-left:32px;border-left:1px solid var(--border);min-width:160px" class="donut-extra">
          <div style="display:flex;flex-direction:column;gap:6px">
             <span style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Total Portfolio</span>
             <span style="font-family:'Syne',sans-serif;font-size:22px;font-weight:700;color:var(--text)">{{ (snapshot?.netWorth || 0) | formatCurrency }}</span>
          </div>
          
          @if (dominantAsset) {
          <div style="display:flex;flex-direction:column;gap:6px">
             <span style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--muted)">Top Asset Class</span>
             <span style="font-size:14px;color:var(--accent);font-weight:600">{{ dominantAsset.label }} <span style="font-size:12px;color:var(--muted);font-weight:400;margin-left:4px">{{ dominantAsset.pct }}%</span></span>
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
  legend: { label: string; color: string; pct: string; value: number }[] = [];

  get dominantAsset() {
    if (!this.legend.length) return null;
    return this.legend.reduce((max, item) => (item.value > max.value ? item : max), this.legend[0]);
  }

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
    const total = (s.cash || 0) + (s.equity || 0) + (s.debt || 0) + (s.other || 0) || 1;
    const segs = [
      { v: s.debt || 0, c: 'rgba(240,200,96,0.85)' },
      { v: s.equity || 0, c: 'rgba(200,240,96,0.85)' },
      { v: s.cash || 0, c: 'rgba(96,240,200,0.85)' },
      { v: s.other || 0, c: 'rgba(150,150,180,0.85)' },
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

    // Dynamic hole color based on theme
    ctx.beginPath();
    ctx.arc(cx, cy, ir, 0, Math.PI * 2);
    
    // Check multiple places for theme variables
    const isLight = document.body.classList.contains('theme-light') || document.documentElement.getAttribute('data-theme') === 'light';
    const computedDoc = getComputedStyle(document.documentElement);
    const computedBody = getComputedStyle(document.body);
    
    // The surface color could be on body or root depending on how Angular handles styles
    const surface = computedDoc.getPropertyValue('--surface').trim() || computedBody.getPropertyValue('--surface').trim();
    
    ctx.fillStyle = surface || (isLight ? '#ffffff' : '#111118');
    ctx.fill();

    this.legend = [
      { label: 'Debt', color: '#f0c860', pct: (((s.debt || 0) / total) * 100).toFixed(1), value: s.debt || 0 },
      { label: 'Equity', color: '#c8f060', pct: (((s.equity || 0) / total) * 100).toFixed(1), value: s.equity || 0 },
      { label: 'Cash', color: '#60f0c8', pct: (((s.cash || 0) / total) * 100).toFixed(1), value: s.cash || 0 },
      { label: 'Other', color: '#9696b4', pct: (((s.other || 0) / total) * 100).toFixed(1), value: s.other || 0 },
    ];
  }
}

