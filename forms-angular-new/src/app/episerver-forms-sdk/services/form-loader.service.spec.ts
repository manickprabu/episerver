import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FormContainer } from '../models';
import { ApiClientService } from './api-client.service';
import { FormLoaderService } from './form-loader.service';

describe('FormLoaderService', () => {
  let service: FormLoaderService<FormContainer>;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiClientService,
        FormLoaderService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(FormLoaderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads a form from the headless API', async () => {
    const promise = service.getForm('demo-key', 'en', { baseURL: '/' });
    const req = httpMock.expectOne('/_forms/v1/forms/demo-key?locale=en');

    expect(req.request.method).toBe('GET');
    req.flush({ key: 'demo-key' });

    await expect(promise).resolves.toEqual({ key: 'demo-key' });
  });

  it('queries a form from Optimizely Graph and normalizes key casing', async () => {
    const promise = service.queryForm('https://graph.example.com', 'demo-key', 'en');
    const req = httpMock.expectOne('https://graph.example.com');

    expect(req.request.method).toBe('POST');
    expect(req.request.body.variables).toEqual({ key: 'demo-key', language: 'en' });
    req.flush({
      data: {
        FormContainer: {
          items: [
            {
              Key: 'demo-key',
              Locale: 'en',
              Properties: { Title: 'Demo form' },
              FormElements: []
            }
          ]
        }
      }
    });

    await expect(promise).resolves.toEqual({
      key: 'demo-key',
      locale: 'en',
      properties: { title: 'Demo form' },
      formElements: []
    });
  });
});
