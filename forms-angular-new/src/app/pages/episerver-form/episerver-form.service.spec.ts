import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { FormSubmitModel } from '../../episerver-forms/episerver-sdk';
import { EpiserverFormDefinition } from '../../episerver-forms/models/episerver-form-definition.model';
import { EpiserverFormService } from './episerver-form.service';

describe('EpiserverFormService', () => {
  let service: EpiserverFormService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EpiserverFormService, provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(EpiserverFormService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function createSource(): EpiserverFormDefinition {
    return {
      formGuid: 'form-guid',
      antiforgery: { headerName: 'RequestVerificationToken', token: 'token' },
      fields: [
        {
          id: 31801,
          contentGuid: 'guid-1',
          contentLink: { id: 31801 },
          type: 'FileUploadElementBlockProxy',
          value: '[{"DownloadUrl":"/globalassets/forms-upload-assets/demo-test2.pdf","Name":"demo-test.pdf","AssetGuid":"asset-123"}]',
          properties: {}
        },
        { id: 31802, contentGuid: 'guid-2', properties: {} }
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
      currentStepIndex: 2,
      submissionData: [
        { elementKey: 'guid-1', value: 'Yes' },
        { elementKey: 'guid-2', value: 'No' },
        { elementKey: '__FormGuid', value: 'system' },
        { elementKey: 'empty', value: '' }
      ]
    } as FormSubmitModel;
  }

  it('loads a cloned debug form', () => {
    let first!: EpiserverFormDefinition;
    let second!: EpiserverFormDefinition;

    service.loadForm().subscribe(value => {
      first = value;
      value.fields[0].name = 'Mutated';
    });
    service.loadForm().subscribe(value => {
      second = value;
    });

    expect(first).toBeDefined();
    expect(second.fields[0].name).not.toBe('Mutated');
  });

  it('posts JSON payload for partial save when there are no files', () => {
    service.savePartial(createSource(), createModel()).subscribe();

    const request = httpMock.expectOne('http://localhost:8000/test-episerver-form');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('RequestVerificationToken')).toBe('token');
    expect(request.request.body).toEqual({
      FormKey: 'form-guid',
      Locale: 'en',
      IsFinalized: false,
      SubmissionKey: 'submission-guid',
      HostedPageUrl: 'http://localhost/form',
      CurrentStep: 2,
      Fields: {
        __field_31801: 'Yes',
        __field_31802: 'No',
        __FormGuid: 'system'
      }
    });

    request.flush({ success: true });
  });

  it('puts multipart payload for final submit when there are files', () => {
    const model = createModel();
    model.isFinalized = true;
    model.submissionData = [
      { elementKey: 'guid-1', value: [{ name: 'contract.pdf', url: '', assetGuid: '', file: new File(['123'], 'contract.pdf') }] }
    ] as never;

    service.submitFinal(createSource(), model).subscribe();

    const request = httpMock.expectOne('http://localhost:8000/test-episerver-form');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body instanceof FormData).toBeTrue();

    const body = request.request.body as FormData;
    expect(body.get('__field_31801_file_0')).toEqual(jasmine.any(File));
    expect(JSON.parse(String(body.get('data')))).toEqual({
      FormKey: 'form-guid',
      Locale: 'en',
      IsFinalized: true,
      SubmissionKey: 'submission-guid',
      HostedPageUrl: 'http://localhost/form',
      CurrentStep: 2,
      Fields: {
        __field_31801: '[{"DownloadUrl":"","Name":"contract.pdf","AssetGuid":""}]'
      }
    });

    request.flush({ success: true });
  });

  it('omits antiforgery headers when missing', () => {
    const source = createSource();
    delete source.antiforgery;

    service.savePartial(source, createModel()).subscribe();

    const request = httpMock.expectOne('http://localhost:8000/test-episerver-form');
    expect(request.request.headers.has('RequestVerificationToken')).toBeFalse();
    request.flush({ success: true });
  });

  it('posts removed existing uploaded files as RemovedFileFields', () => {
    const model = createModel();
    model.submissionData = [{ elementKey: 'guid-1', value: [] }] as never;

    service.savePartial(createSource(), model).subscribe();

    const request = httpMock.expectOne('http://localhost:8000/test-episerver-form');
    expect(request.request.body instanceof FormData).toBeTrue();

    const body = request.request.body as FormData;
    expect(body.getAll('RemovedFileFields')).toEqual(['__fields_31801|/globalassets/forms-upload-assets/demo-test2.pdf']);
    expect(JSON.parse(String(body.get('data')))).toEqual({
      FormKey: 'form-guid',
      Locale: 'en',
      IsFinalized: false,
      SubmissionKey: 'submission-guid',
      HostedPageUrl: 'http://localhost/form',
      CurrentStep: 2,
      Fields: {}
    });

    request.flush({ success: true });
  });

  it('keeps existing file list metadata in the submitted field value', () => {
    const model = createModel();
    model.submissionData = [
      {
        elementKey: 'guid-1',
        value: [{ name: 'demo-test.pdf', url: '/globalassets/forms-upload-assets/demo-test2.pdf', assetGuid: 'asset-123' }]
      }
    ] as never;

    service.savePartial(createSource(), model).subscribe();

    const request = httpMock.expectOne('http://localhost:8000/test-episerver-form');
    expect(request.request.body).toEqual({
      FormKey: 'form-guid',
      Locale: 'en',
      IsFinalized: false,
      SubmissionKey: 'submission-guid',
      HostedPageUrl: 'http://localhost/form',
      CurrentStep: 2,
      Fields: {
        __field_31801: '[{"DownloadUrl":"/globalassets/forms-upload-assets/demo-test2.pdf","Name":"demo-test.pdf","AssetGuid":"asset-123"}]'
      }
    });

    request.flush({ success: true });
  });
});
