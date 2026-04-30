import { Injectable } from '@angular/core';

@Injectable()
export class BrowserStorageService {
  getSessionStorage(): Storage | null {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  }
}
