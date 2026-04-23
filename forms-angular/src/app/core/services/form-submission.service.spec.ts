import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FormSubmissionService } from './form-submission.service';
import { sampleSupportRequestForm } from '../../features/forms/pages/form-container-page/form-container-page.schema';

describe('FormSubmissionService', () => {
  let service: FormSubmissionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormSubmissionService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(FormSubmissionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('serializes the same submit contract fields used by the React implementation', () => {
    const formGroup = new FormGroup({
      firstName: new FormControl('Ada'),
      emailAddress: new FormControl('ada@example.com'),
      interests: new FormControl(['planning', 'payloads']),
      contactReason: new FormControl('migration'),
      details: new FormControl('Please preserve this payload shape.'),
      website: new FormControl('https://example.com/current-form'),
      resetForm: new FormControl(null),
      submitForm: new FormControl(null)
    });

    const payload = service.buildSubmissionData(
      sampleSupportRequestForm,
      formGroup,
      1,
      'https://app.example/forms/container',
      'token-123',
      true,
      'partial-456'
    );

    service.submit('https://cms.example/', payload).subscribe();

    const request = httpMock.expectOne('https://cms.example/_forms/v1/forms');
    expect(request.request.method).toBe('PUT');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token-123');

    const body = request.request.body as FormData;
    const data = JSON.parse(body.get('data') as string);

    expect(data).toEqual({
      FormKey: 'support-request',
      Locale: 'en',
      IsFinalized: true,
      SubmissionKey: 'partial-456',
      HostedPageUrl: 'https://app.example/forms/container',
      CurrentStep: 1,
      Fields: {
        firstName: 'Ada',
        emailAddress: 'ada@example.com',
        interests: 'planning,payloads',
        contactReason: 'migration',
        details: 'Please preserve this payload shape.',
        website: 'https://example.com/current-form',
        resetForm: null,
        submitForm: null
      }
    });

    request.flush({ success: true, submissionKey: 'partial-456', messages: [] });
  });
});
