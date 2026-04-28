import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { FormSchema } from '../models/form-schema.model';
import { FormsApiClient } from './forms-api.client';

export interface FormLoaderOptions {
  formKey: string;
  language: string;
  baseUrl: string;
  optiGraphUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FormLoaderService {
  private readonly formsApiClient = inject(FormsApiClient);

  loadForm(options: FormLoaderOptions): Observable<FormSchema | null> {
    const request$ = options.optiGraphUrl
      ? this.formsApiClient.queryForm(options.optiGraphUrl, options.formKey, options.language)
      : this.formsApiClient.getForm(options.baseUrl, options.formKey, options.language);

    return request$;
  }
}
