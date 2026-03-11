import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login-overlay',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div id="loginOverlay">
      <div class="login-box">
        <div class="login-logo">Wealth <span>Tracker</span></div>
        <div class="login-sub">Personal Finance Dashboard</div>
        <input class="login-inp" type="text" placeholder="Username" autocomplete="username" [(ngModel)]="user" />
        <input class="login-inp" type="password" placeholder="Password" autocomplete="current-password" [(ngModel)]="pass" (keydown.enter)="submit()" />
        <button class="login-btn" type="button" (click)="submit()">Sign In →</button>
        <div class="login-err">{{ error }}</div>
      </div>
    </div>
  `,
})
export class LoginOverlayComponent {
  @Output() readonly login = new EventEmitter<{ user: string; pass: string }>();
  user = '';
  pass = '';
  error = '';

  submit(): void {
    if (!this.user.trim() || !this.pass) {
      this.error = 'Enter username and password';
      return;
    }
    this.error = 'Signing in...';
    this.login.emit({ user: this.user.trim(), pass: this.pass });
  }

  setError(message: string): void {
    this.error = message;
  }
}
