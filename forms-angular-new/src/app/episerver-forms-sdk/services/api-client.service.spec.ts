import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApiClientConfig } from '../models';
import { ApiClientService } from './api-client.service';

const config: ApiClientConfig = {
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json'
  }
};

describe('ApiClientService', () => {
  let service: ApiClientService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiClientService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(ApiClientService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sends GET requests with query params', async () => {
    const promise = service.get<{ value: string }>(config, '_forms/v1/forms/demo', { locale: 'en' });
    const req = httpMock.expectOne('/_forms/v1/forms/demo?locale=en');

    expect(req.request.method).toBe('GET');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ value: 'ok' });

    await expect(promise).resolves.toEqual({ value: 'ok' });
  });

  it('sends POST requests with a JSON body', async () => {
    const payload = { query: 'FormQuery' };
    const promise = service.post<{ accepted: boolean }>(config, '/graphql', payload);
    const req = httpMock.expectOne('http://graphql/');

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ accepted: true });

    await expect(promise).resolves.toEqual({ accepted: true });
  });
});
