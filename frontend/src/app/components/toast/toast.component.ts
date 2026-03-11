import { Component, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [NgClass],
  template: `
    <div
      id="toast"
      [class.show]="toast.visible()"
      [ngClass]="toast.type()"
    >
      {{ toast.message() }}
    </div>
  `,
})
export class ToastComponent {
  protected readonly toast = inject(ToastService);
}
