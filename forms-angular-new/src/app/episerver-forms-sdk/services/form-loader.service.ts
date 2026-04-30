import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { ApiClientConfig, DEFAULT_API_CLIENT_CONFIG, FormContainer } from '../models';
import { ApiClientService } from './api-client.service';

const API_ENDPOINT = '_forms/v1/forms';

@Injectable()
export class FormLoaderService<T extends FormContainer> {
  constructor(
    private readonly apiClient: ApiClientService,
    private readonly http: HttpClient
  ) {}

  getForm(key: string, language: string, config?: Partial<ApiClientConfig>): Promise<T> {
    const resolvedConfig: ApiClientConfig = { ...DEFAULT_API_CLIENT_CONFIG, ...config };
    return this.apiClient.get<T>(resolvedConfig, `${API_ENDPOINT}/${key}`, { locale: language });
  }

  async queryForm(optiGraphUrl: string, key: string, language: string): Promise<T> {
    const query = `
            query FormQuery($key: String, $language: String) {
                FormContainer(where: { Key: { eq: $key }, Locale: { eq: $language } }) {
                    items {
                        Key
                        Locale
                        Properties
                        Localizations
                        FormElements {
                            Key
                            ContentType
                            DisplayName
                            Locale
                            Localizations
                            Properties
                            Locale
                        }
                    }
                }
            }
            `;
    const variables = { key, language };

    const response = await firstValueFrom(
      this.http.post<{ data: { FormContainer: { items: unknown[] } } }>(
        optiGraphUrl,
        { query, variables },
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            Accept: 'application/json'
          })
        }
      )
    );

    const form = response.data.FormContainer.items[0];
    return this.convertFirstLetterToLowerCase(form) as T;
  }

  private convertFirstLetterToLowerCase(data: unknown): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => this.convertFirstLetterToLowerCase(item));
    }

    if (data && typeof data === 'object') {
      return Object.keys(data).reduce((accumulator, key) => {
        const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
        (accumulator as Record<string, unknown>)[normalizedKey] = this.convertFirstLetterToLowerCase(
          (data as Record<string, unknown>)[key]
        );
        return accumulator;
      }, {} as Record<string, unknown>);
    }

    return data;
  }
}
