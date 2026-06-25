import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { FormSubmitModel } from '../../episerver-forms/episerver-sdk';
import { EpiserverFormDefinition } from '../../episerver-forms/models/episerver-form-definition.model';
import { EpiserverFormAccordionService } from './episerver-form-accordion.service';

describe('EpiserverFormAccordionService', () => {
  let service: EpiserverFormAccordionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EpiserverFormAccordionService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(EpiserverFormAccordionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function createSource(): EpiserverFormDefinition {
    return {
      antiforgery: { headerName: 'X-CSRF', token: 'token' },
      fields: [
        {
          contentGuid: 'guid-1',
          contentLink: { id: 31796 },
          id: 31796,
          type: 'FileUploadElementBlockProxy',
          value: '[{"DownloadUrl":"/globalassets/forms-upload-assets/demo-test2.pdf","Name":"demo-test.pdf","AssetGuid":"asset-123"}]',
          properties: {}
        },
        {
          contentGuid: 'guid-2',
          contentLink: { id: 31797 },
          id: 31797,
          type: 'SelectionElementBlockProxy',
          value: 'No',
          properties: {}
        }
      ]
    } as EpiserverFormDefinition;
  }

  function createModel(): FormSubmitModel {
    return {
      formKey: 'form-guid',
      locale: 'en',
      isFinalized: false,
      partialSubmissionKey: 'submission-guid',
      hostedPageUrl: 'http://localhost/form',
      currentStepIndex: 1,
      submissionData: [{ elementKey: 'guid-2', value: 'Yes' }]
    } as FormSubmitModel;
  }

  it('returns cloned debug forms', () => {
    let first!: EpiserverFormDefinition;
    let second!: EpiserverFormDefinition;

    service.loadForm().subscribe(value => {
      first = value;
      value.fields[0].name = 'Changed';
    });
    service.loadForm().subscribe(value => {
      second = value;
    });

    expect(first).toBeDefined();
    expect(second.fields[0].name).not.toBe('Changed');
  });

  it('serializes contentLink ids for partial save', () => {
    service.savePartial(createSource(), createModel()).subscribe();

    const request = httpMock.expectOne('http://localhost:8000/test-episerver-form');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-CSRF')).toBe('token');
    expect(request.request.body).toEqual({
      FormKey: 'form-guid',
      Locale: 'en',
      IsFinalized: false,
      SubmissionKey: 'submission-guid',
      HostedPageUrl: 'http://localhost/form',
      CurrentStep: 1,
      Fields: {
        __field_31797: 'Yes'
      }
    });

    request.flush({ success: true });
  });

  it('builds FormData when attachments are included', () => {
    const model = createModel();
    model.submissionData = [{ elementKey: 'guid-1', value: [{ name: 'photo.jpg', url: '', assetGuid: '', file: new File(['img'], 'photo.jpg') }] }] as never;

    service.submitFinal(createSource(), model).subscribe();

    const request = httpMock.expectOne('http://localhost:8000/test-episerver-form');
    expect(request.request.method).toBe('PUT');
    const formData = request.request.body as FormData;
    expect(formData instanceof FormData).toBeTrue();
    expect(formData.get('__field_31796_file_0')).toEqual(jasmine.any(File));
    expect(JSON.parse(String(formData.get('data'))).Fields).toEqual({ __field_31796: '[{"DownloadUrl":"","Name":"photo.jpg","AssetGuid":""}]' });
    request.flush({ success: true });
  });

  it('includes RemovedFileFields when an existing uploaded file is deleted', () => {
    const model = createModel();
    model.submissionData = [{ elementKey: 'guid-1', value: [] }] as never;

    service.savePartial(createSource(), model).subscribe();

    const request = httpMock.expectOne('http://localhost:8000/test-episerver-form');
    expect(request.request.body instanceof FormData).toBeTrue();

    const body = request.request.body as FormData;
    expect(body.getAll('RemovedFileFields')).toEqual(['__fields_31796|/globalassets/forms-upload-assets/demo-test2.pdf']);
    expect(JSON.parse(String(body.get('data'))).Fields).toEqual({ __field_31796: [] });
    request.flush({ success: true });
  });
});
