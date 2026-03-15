import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatCurrency',
  standalone: true,
})
export class FormatCurrencyPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    const safe = value ?? 0;
    if (safe >= 10000000) {
      return `₹${(safe / 10000000).toFixed(2)}Cr`;
    }
    if (safe < 100000) {
      return `₹${(safe / 1000).toFixed(2)}K`;
    }
    return `₹${(safe / 100000).toFixed(2)}L`;
  }
}
