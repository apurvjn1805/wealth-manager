import { Injectable, signal } from '@angular/core';

export type ToastType = 'ok' | 'err';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal('');
  readonly type = signal<ToastType>('ok');
  readonly visible = signal(false);
  private timer?: ReturnType<typeof setTimeout>;

  show(message: string, type: ToastType = 'ok'): void {
    this.message.set(message);
    this.type.set(type);
    this.visible.set(true);
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => this.visible.set(false), 3200);
  }
}
