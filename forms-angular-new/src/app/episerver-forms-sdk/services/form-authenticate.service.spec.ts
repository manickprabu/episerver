import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { FormAuthenticateConfig } from '../models';
import { FormAuthenticateService } from './form-authenticate.service';

const config: FormAuthenticateConfig = {
  clientId: 'forms-client',
  grantType: 'password',
  authBaseUrl: 'https://example.com/connect/token'
};

describe('FormAuthenticateService', () => {
  let service: FormAuthenticateService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormAuthenticateService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(FormAuthenticateService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('posts form-encoded credentials and returns the access token', async () => {
    const promise = service.login(config, 'ada', 'secret');
    const req = httpMock.expectOne('https://example.com/connect/token');

    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe(
      'application/x-www-form-urlencoded;charset=UTF-8'
    );
    expect(req.request.body).toContain('username=ada');
    expect(req.request.body).toContain('password=secret');
    expect(req.request.body).toContain('grant_type=password');
    expect(req.request.body).toContain('client_id=forms-client');

    req.flush({ access_token: 'token-123' });

    await expect(promise).resolves.toBe('token-123');
  });
});
