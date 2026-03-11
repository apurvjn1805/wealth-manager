import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly authHeader = signal('');
  readonly isLoggedIn = signal(false);

  setCredentials(user: string, pass: string): void {
    this.authHeader.set(`Basic ${btoa(`${user}:${pass}`)}`);
  }

  clearCredentials(): void {
    this.authHeader.set('');
    this.isLoggedIn.set(false);
  }

  markLoggedIn(): void {
    this.isLoggedIn.set(true);
  }
}
