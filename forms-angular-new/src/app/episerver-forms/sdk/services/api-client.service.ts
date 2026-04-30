import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiClientConfig } from '../models';

@Injectable()
export class ApiClientService {
  constructor(private readonly http: HttpClient) {}

  async send<T>(
    config: ApiClientConfig,
    path: string,
    method: string,
    params?: Record<string, string>,
    headers?: Record<string, string>,
    data?: unknown
  ): Promise<T> {
    const url = this.buildUrl(config.baseURL, path, params);

    return firstValueFrom(
      this.http.request<T>(method, url, {
        body: data,
        headers: new HttpHeaders(headers ?? config.headers),
        withCredentials: true
      })
    );
  }

  get<T>(config: ApiClientConfig, path: string, params?: Record<string, string>): Promise<T> {
    return this.send<T>(config, path, 'GET', params);
  }

  post<T>(config: ApiClientConfig, path: string, data: unknown, params?: Record<string, string>): Promise<T> {
    return this.send<T>(config, path, 'POST', params, undefined, data);
  }

  private buildUrl(baseUrl: string, path: string, params?: Record<string, string>): string {
    const tempBase = 'http://temp';
    const url = new URL(`${baseUrl}${path}`, tempBase);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    return url.origin === tempBase ? `${url.pathname}${url.search}` : url.toString();
  }
}
