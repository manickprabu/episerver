import { Injectable } from '@angular/core';

import { FormContainer, FormSubmission } from '../models';
import { BrowserStorageService } from './browser-storage.service';

@Injectable()
export class FormStorageService {
  constructor(private readonly browserStorageService: BrowserStorageService) {}

  saveFormDataToStorage(form: FormContainer, data: FormSubmission[]): FormSubmission[] {
    const storage = this.browserStorageService.getSessionStorage();

    if (!storage) {
      return data;
    }

    try {
      storage.setItem(form.key, JSON.stringify(data));
    } catch (error) {
      console.log(`Local Storage not supported: ${(error as Error).message}`);
    }

    return data;
  }

  loadFormDataFromStorage(form: FormContainer): FormSubmission[] {
    const raw = this.browserStorageService.getSessionStorage()?.getItem(form.key);

    if (!raw) {
      return [];
    }

    try {
      return (JSON.parse(raw) as FormSubmission[]) ?? [];
    } catch {
      return [];
    }
  }

  removeFormDataInStorage(form: FormContainer): void {
    this.browserStorageService.getSessionStorage()?.removeItem(form.key);
  }
}
