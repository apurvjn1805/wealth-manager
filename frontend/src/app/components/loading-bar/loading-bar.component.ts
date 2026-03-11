import { Component, inject } from '@angular/core';
import { LoadingService } from '../../core/services/loading.service';

@Component({
  selector: 'app-loading-bar',
  standalone: true,
  template: `<div id="loadingBar" [style.width.%]="loading.percent()"></div>`,
})
export class LoadingBarComponent {
  protected readonly loading = inject(LoadingService);
}
