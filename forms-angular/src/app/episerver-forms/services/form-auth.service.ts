import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

export interface IdentityInfo {
  username: string;
  accessToken: string;
}

interface AuthResponse {
  access_token: string;
}

const FORM_ACCESS_TOKEN = 'form_access_token';

@Injectable({
  providedIn: 'root'
})
export class FormAuthService {
  private readonly httpClient = inject(HttpClient);

  login(username: string, password: string, clientId: string, authBaseUrl: string): Observable<string> {
    const body = new HttpParams({
      fromObject: {
        username,
        password,
        grant_type: 'password',
        client_id: clientId
      }
    });

    return this.httpClient
      .post<AuthResponse>(authBaseUrl, body.toString(), {
        headers: new HttpHeaders({
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
        })
      })
      .pipe(map((response) => response.access_token));
  }

  hasAccessToken(): boolean {
    return !!sessionStorage.getItem(FORM_ACCESS_TOKEN);
  }

  storeAccessToken(accessToken: string): void {
    sessionStorage.setItem(FORM_ACCESS_TOKEN, accessToken);
  }

  clearAccessToken(): void {
    sessionStorage.removeItem(FORM_ACCESS_TOKEN);
  }
}
