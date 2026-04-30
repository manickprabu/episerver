import { TestBed } from '@angular/core/testing';

import { BrowserStorageService } from './browser-storage.service';
import { FormCacheService } from './form-cache.service';

class MemoryStorage implements Storage {
  private readonly state = new Map<string, string>();

  get length(): number {
    return this.state.size;
  }

  clear(): void {
    this.state.clear();
  }

  getItem(key: string): string | null {
    return this.state.has(key) ? this.state.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.state.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.state.delete(key);
  }

  setItem(key: string, value: string): void {
    this.state.set(key, value);
  }
}

describe('FormCacheService', () => {
  let service: FormCacheService;
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();

    TestBed.configureTestingModule({
      providers: [
        FormCacheService,
        {
          provide: BrowserStorageService,
          useValue: {
            getSessionStorage: () => storage
          }
        }
      ]
    });

    service = TestBed.inject(FormCacheService);
  });

  it('stores and loads object values', () => {
    service.set('form', { step: 1 });

    expect(service.get<{ step: number }>('form')).toEqual({ step: 1 });
  });

  it('stores and loads string values', () => {
    service.set('form-key', 'abc');

    expect(service.get<string>('form-key')).toBe('abc');
  });

  it('removes stored values', () => {
    service.set('form', { step: 1 });
    service.remove('form');

    expect(service.get('form')).toBeUndefined();
  });
});
