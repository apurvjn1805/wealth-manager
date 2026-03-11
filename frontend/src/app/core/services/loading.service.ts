import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  readonly percent = signal(0);

  set(value: number): void {
    this.percent.set(value);
    if (value >= 100) {
      setTimeout(() => this.percent.set(0), 400);
    }
  }
}
