import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Goal } from '../../core/models/wealth.models';

@Component({
    selector: 'app-goal-tracker',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="goal-card">
      <h3>Financial Goals</h3>
      <div *ngFor="let goal of goals" class="goal-item">
        <div class="goal-header">
          <span>{{ goal.name }}</span>
          <span>{{ (goal.current / goal.target * 100) | number:'1.1-1' }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="(goal.current / goal.target * 100)"></div>
        </div>
        <div class="goal-footer">
          <span>Target: {{ goal.target | number }}</span>
          <span>Remaining: {{ (goal.target - goal.current) | number }}</span>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .goal-card {
      background: var(--surface-light);
      padding: 1.5rem;
      border-radius: 12px;
      margin-top: 1rem;
    }
    .goal-item { margin-bottom: 1.5rem; }
    .goal-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-weight: 500; }
    .progress-bar { background: var(--border-color); height: 8px; border-radius: 4px; overflow: hidden; }
    .progress-fill { background: var(--primary-color); height: 100%; transition: width 0.3s ease; }
    .goal-footer { display: flex; justify-content: space-between; font-size: 0.8rem; margin-top: 0.25rem; opacity: 0.7; }
  `]
})
export class GoalTrackerComponent {
    @Input() goals: Goal[] = [];
}
