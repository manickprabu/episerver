import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FormsApiClient } from './forms-api.client';

describe('FormsApiClient', () => {
  let client: FormsApiClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormsApiClient, provideHttpClient(), provideHttpClientTesting()]
    });

    client = TestBed.inject(FormsApiClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads a form from the headless forms endpoint with locale and credentials', () => {
    client.getForm('https://cms.example/', 'form-guid', 'sv').subscribe();

    const request = httpMock.expectOne('https://cms.example/_forms/v1/forms/form-guid?locale=sv');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);

    request.flush({ key: 'form-guid', properties: {}, formElements: [] });
  });

  it('queries Optimizely Graph and lowercases the returned schema keys', () => {
    let result: Record<string, unknown> | null = null;

    client.queryForm('https://graph.example/', 'form-guid', 'en').subscribe((response) => {
      result = response as Record<string, unknown> | null;
    });

    const request = httpMock.expectOne('https://graph.example/');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    expect(request.request.body.variables).toEqual({ key: 'form-guid', language: 'en' });

    request.flush({
      data: {
        FormContainer: {
          items: [
            {
              Key: 'form-guid',
              Locale: 'en',
              Properties: { Title: 'Sample form' },
              Localizations: { NextButtonLabel: 'Next' },
              FormElements: [
                {
                  Key: 'field-1',
                  ContentType: 'TextboxElementBlock',
                  Properties: { Label: 'Name' }
                }
              ]
            }
          ]
        }
      }
    });

    expect(result).toEqual({
      key: 'form-guid',
      locale: 'en',
      properties: { title: 'Sample form' },
      localizations: { nextButtonLabel: 'Next' },
      formElements: [
        {
          key: 'field-1',
          contentType: 'TextboxElementBlock',
          properties: { label: 'Name' }
        }
      ]
    });
  });
});
