import { Injectable } from '@angular/core';

import { BrowserStorageService } from './browser-storage.service';

@Injectable()
export class FormCacheService {
  constructor(private readonly browserStorageService: BrowserStorageService) {}

  get<T>(key: string): T | undefined {
    const storage = this.browserStorageService.getSessionStorage();
    const raw = storage?.getItem(key);

    if (!raw) {
      return undefined;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as T;
    }
  }

  set<T>(key: string, data: T): T {
    const storage = this.browserStorageService.getSessionStorage();

    if (!storage) {
      return data;
    }

    try {
      const value = typeof data === 'string' ? data : JSON.stringify(data);
      storage.setItem(key, value);
    } catch (error) {
      console.log(`Local Storage not supported: ${(error as Error).message}`);
    }

    return data;
  }

  remove(key: string): void {
    this.browserStorageService.getSessionStorage()?.removeItem(key);
  }
}
