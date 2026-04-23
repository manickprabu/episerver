import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { FormSchema } from '../models/form-schema.model';

interface GraphResponse<T> {
  data?: {
    FormContainer?: {
      items?: T[];
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class FormsApiClient {
  private readonly httpClient = inject(HttpClient);

  getForm(baseUrl: string, formKey: string, language: string): Observable<FormSchema> {
    const params = new HttpParams().set('locale', language);
    return this.httpClient.get<FormSchema>(`${baseUrl}_forms/v1/forms/${formKey}`, {
      params,
      withCredentials: true
    });
  }

  queryForm(optiGraphUrl: string, formKey: string, language: string): Observable<FormSchema | null> {
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

    return this.httpClient
      .post<GraphResponse<Record<string, unknown>>>(
        optiGraphUrl,
        {
          query,
          variables: { key: formKey, language }
        },
        {
          headers: new HttpHeaders({
            'Content-Type': 'application/json',
            Accept: 'application/json'
          })
        }
      )
      .pipe(map((response) => this.convertFirstLetterToLowerCase(response.data?.FormContainer?.items?.[0] ?? null) as FormSchema | null));
  }

  private convertFirstLetterToLowerCase(data: unknown): unknown {
    if (Array.isArray(data)) {
      return data.map((item) => this.convertFirstLetterToLowerCase(item));
    }

    if (data && typeof data === 'object') {
      return Object.entries(data as Record<string, unknown>).reduce<Record<string, unknown>>((accumulator, [key, value]) => {
        const normalizedKey = key.charAt(0).toLowerCase() + key.slice(1);
        accumulator[normalizedKey] = this.convertFirstLetterToLowerCase(value);
        return accumulator;
      }, {});
    }

    return data;
  }
}
