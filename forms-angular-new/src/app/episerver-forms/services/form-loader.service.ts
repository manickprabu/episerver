import { Injectable } from '@angular/core';
import { from, Observable } from 'rxjs';

import { FormLoaderService as SdkFormLoaderService } from '../../episerver-forms/episerver-sdk';
import { FormSchema } from '../models/form-schema.model';

export interface UseFormLoaderProps {
  formKey: string;
  language?: string;
  baseUrl: string;
  optiGraphUrl?: string;
}

@Injectable()
export class FormLoaderService {
  constructor(private readonly sdkFormLoaderService: SdkFormLoaderService<FormSchema>) {}

  load(config: UseFormLoaderProps): Observable<FormSchema> {
    const language = config.language ?? 'en';

    if (config.optiGraphUrl) {
      return from(this.sdkFormLoaderService.queryForm(config.optiGraphUrl, config.formKey, language));
    }

    return from(
      this.sdkFormLoaderService.getForm(config.formKey, language, {
        baseURL: config.baseUrl
      })
    );
  }
}
