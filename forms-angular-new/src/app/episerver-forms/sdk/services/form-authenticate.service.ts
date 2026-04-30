import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { FormAuthenticateConfig } from '../models';

@Injectable()
export class FormAuthenticateService {
  constructor(private readonly http: HttpClient) {}

  async login(config: FormAuthenticateConfig, username: string, password: string): Promise<string> {
    const payload: Record<string, string> = {
      username,
      password,
      grant_type: config.grantType,
      client_id: config.clientId
    };

    const response = await firstValueFrom(
      this.http.post<Record<string, string>>(config.authBaseUrl, this.convertObjectToFormBody(payload), {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        }),
        responseType: 'json'
      })
    );

    return response['access_token'];
  }

  private convertObjectToFormBody(payload: Record<string, string>): string {
    return Object.entries(payload)
      .map(([property, value]) => `${encodeURIComponent(property)}=${encodeURIComponent(value)}`)
      .join('&');
  }
}
