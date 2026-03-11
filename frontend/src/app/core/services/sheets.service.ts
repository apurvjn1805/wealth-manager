import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SheetsService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  async read(): Promise<ResponseLike<{ snapshots: Record<string, string>[]; sips: Record<string, string>[] }>> {
    return this.call({ action: 'read' });
  }

  async write(tab: string, data: unknown): Promise<ResponseLike<{ ok?: boolean; error?: string }>> {
    return this.call({ action: 'write', tab, data });
  }

  private async call(body: unknown): Promise<ResponseLike<any>> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: this.auth.authHeader(),
    });

    try {
      const result = await firstValueFrom(
        this.http.post<any>('/.netlify/functions/sheets', body, {
          headers,
          observe: 'response',
        }),
      );
      return {
        ok: result.status >= 200 && result.status < 300,
        status: result.status,
        json: async () => result.body ?? {},
      };
    } catch (error: any) {
      return {
        ok: false,
        status: error?.status ?? 500,
        json: async () => error?.error ?? { error: 'Request failed' },
      };
    }
  }
}

interface ResponseLike<T = any> {
  ok: boolean;
  status: number;
  json: () => Promise<T>;
}
