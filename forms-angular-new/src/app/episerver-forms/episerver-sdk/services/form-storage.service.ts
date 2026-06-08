import { Injectable } from '@angular/core';

import { FormContainer, FormSubmission } from '../models';
import { BrowserStorageService } from './browser-storage.service';

@Injectable()
export class FormStorageService {
  private readonly draftCache = new Map<string, FormSubmission[]>();

  constructor(private readonly browserStorageService: BrowserStorageService) {}

  saveFormDataToStorage(form: FormContainer, data: FormSubmission[]): FormSubmission[] {
    const storage = this.browserStorageService.getSessionStorage();
    this.draftCache.set(form.key, data);

    if (!storage) {
      return data;
    }

    try {
      storage.setItem(form.key, JSON.stringify(this.serializeSubmissions(data)));
    } catch (error) {
      console.log(`Local Storage not supported: ${(error as Error).message}`);
    }

    return data;
  }

  loadFormDataFromStorage(form: FormContainer): FormSubmission[] {
    const cachedDraft = this.draftCache.get(form.key);
    if (cachedDraft) {
      return cachedDraft;
    }

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
    this.draftCache.delete(form.key);
    this.browserStorageService.getSessionStorage()?.removeItem(form.key);
  }

  private serializeSubmissions(submissions: FormSubmission[]): FormSubmission[] {
    return submissions.map(submission => ({
      ...submission,
      value: this.serializeValue(submission.value),
      prevValue: this.serializeValue(submission.prevValue)
    }));
  }

  private serializeValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      if (value.some(entry => this.isUploadedFileEntry(entry))) {
        return [];
      }

      return value.map(entry => this.serializeValue(entry));
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, this.serializeValue(entry)])
      );
    }

    return value;
  }

  private isUploadedFileEntry(value: unknown): boolean {
    return typeof value === 'object' && value !== null && ('file' in value || 'name' in value);
  }
}
