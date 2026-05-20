import { ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';

import { EpiserverFormAdapterService } from '../../episerver-forms/services/episerver-form-adapter.service';
import { FormSchemaFormService } from '../../episerver-forms/services/form-schema-form.service';
import { FormSubmissionService } from '../../episerver-forms/services/form-submission.service';
import { EpiserverFormComponent } from './episerver-form.component';
import { EpiserverFormService } from './episerver-form.service';

describe('EpiserverFormComponent', () => {
  const source = {
    fields: [
      {
        name: 'Title',
        type: 'PredefinedHiddenElementBlockProxy',
        contentGuid: 'title-guid',
        value: '',
        properties: { PredefinedValue: 'Type of Seller' }
      },
      {
        name: 'Source',
        type: 'SelectionElementBlockProxy',
        contentGuid: 'source-guid',
        value: 'Yes',
        properties: { AllowMultiSelect: false }
      }
    ]
  } as any;

  const titleField = {
    key: 'title-guid',
    contentType: 'PredefinedHiddenElementBlock',
    properties: { label: 'Title', predefinedValue: 'Type of Seller' }
  } as any;
  const visibleField = {
    key: 'source-guid',
    contentType: 'SelectionElementBlock',
    displayName: 'Source',
    properties: { label: 'Question' }
  } as any;
  const hiddenField = {
    key: 'hidden-guid',
    contentType: 'TextareaElementBlock',
    displayName: 'Hidden',
    properties: { label: 'Hidden question' }
  } as any;
  const stepField = {
    key: 'step-guid',
    contentType: 'FormStepBlock',
    properties: { label: 'Type of Seller', description: 'Seller step description' }
  } as any;
  const secondStepField = {
    key: 'step-guid-2',
    contentType: 'FormStepBlock',
    properties: { label: 'About my home', description: 'Some description to explain about my home that benefits the user' }
  } as any;

  const form = {
    formElements: [titleField, visibleField, hiddenField, stepField, secondStepField],
    steps: [
      {
        formStep: stepField,
        elements: [titleField, visibleField, hiddenField]
      },
      {
        formStep: secondStepField,
        elements: [visibleField]
      }
    ],
    properties: { submitSuccessMessage: 'Submitted' }
  } as any;

  function createComponent(loadForm$ = of(source)) {
    const documentStub = {
      location: { href: 'http://localhost/episerver-form' },
      baseURI: 'http://localhost/',
      getElementById: jasmine.createSpy('getElementById').and.returnValue({ focus: jasmine.createSpy('focus') })
    } as any;
    const changeDetectorRef = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['markForCheck']);
    const destroyCallbacks: Array<() => void> = [];
    const destroyRef = {
      onDestroy(callback: () => void) {
        destroyCallbacks.push(callback);
      }
    } as DestroyRef;
    const episerverFormService = {
      endpoint: 'http://localhost:8000/test-episerver-form',
      loadForm: jasmine.createSpy('loadForm').and.returnValue(loadForm$),
      savePartial: jasmine.createSpy('savePartial').and.returnValue(of({ success: true, submissionKey: 'saved', messages: [{ message: 'Draft saved.' }] })),
      submitFinal: jasmine.createSpy('submitFinal').and.returnValue(of({ success: true, submissionKey: 'submitted', messages: [{ message: 'Done' }] }))
    } as unknown as jasmine.SpyObj<EpiserverFormService>;
    const episerverFormAdapterService = {
      adaptForm: jasmine.createSpy('adaptForm').and.returnValue(form),
      initialSubmissionKey: jasmine.createSpy('initialSubmissionKey').and.returnValue('initial-key')
    } as unknown as jasmine.SpyObj<EpiserverFormAdapterService>;
    const formSchemaFormService = {
      buildForm: jasmine.createSpy('buildForm').and.returnValue({ form, formGroup: new FormGroup({
        'title-guid': new FormControl(''),
        'source-guid': new FormControl(''),
        'hidden-guid': new FormControl('')
      }), steps: form.steps })
    } as unknown as jasmine.SpyObj<FormSchemaFormService>;
    const formSubmissionService = {
      buildSubmitModel: jasmine.createSpy('buildSubmitModel').and.returnValue({ submissionData: [], formKey: 'f', locale: 'en', isFinalized: false, partialSubmissionKey: 'initial-key', hostedPageUrl: 'http://localhost/episerver-form', currentStepIndex: 0 }),
      toFormSubmissions: jasmine.createSpy('toFormSubmissions').and.returnValue([
        { elementKey: 'source-guid', value: 'Yes' },
        { elementKey: 'hidden-guid', value: 'secret' },
        { elementKey: '__FormGuid', value: 'sys' }
      ]),
      clearValidationResults: jasmine.createSpy('clearValidationResults'),
      validateStep: jasmine.createSpy('validateStep').and.returnValue([]),
      applyValidationResults: jasmine.createSpy('applyValidationResults'),
      firstInvalidControlKey: jasmine.createSpy('firstInvalidControlKey').and.returnValue('hidden-guid'),
      applyServerValidation: jasmine.createSpy('applyServerValidation')
    } as any;
    const visibilityState = { visibilityByGuid: { 'source-guid': true, 'hidden-guid': false }, visibilityByContentLinkId: {}, evaluations: [] };
    const watchVisibility$ = new Subject<any>();
    const formDependConditionsService = {
      evaluateFieldVisibility: jasmine.createSpy('evaluateFieldVisibility').and.returnValue(visibilityState),
      syncHiddenControls: jasmine.createSpy('syncHiddenControls'),
      watchVisibility: jasmine.createSpy('watchVisibility').and.returnValue(watchVisibility$),
      isFieldVisible: jasmine.createSpy('isFieldVisible').and.callFake((key: string, state: any) => state.visibilityByGuid[key] !== false)
    } as any;

    const component = new EpiserverFormComponent(
      documentStub,
      changeDetectorRef,
      destroyRef,
      episerverFormService,
      episerverFormAdapterService,
      formSchemaFormService,
      formSubmissionService,
      formDependConditionsService
    );

    return {
      component,
      documentStub,
      changeDetectorRef,
      destroyCallbacks,
      episerverFormService,
      formSubmissionService,
      formDependConditionsService,
      watchVisibility$
    };
  }

  it('initializes from source values, numbers steps, filters visible fields, and saves partial submissions', () => {
    const { component, episerverFormService, formSubmissionService, formDependConditionsService, watchVisibility$ } = createComponent();

    expect((component as any).isLoading).toBeFalse();
    expect((component as any).formGroup.get('source-guid')?.value).toBe('Yes');
    expect((component as any).stepHeading(form.steps[0], 0)).toBe('1. Type of Seller');
    expect((component as any).stepHeading(form.steps[1], 1)).toBe('2. About my home');
    expect((component as any).stepDescription(form.steps[1])).toBe('Some description to explain about my home that benefits the user');
    expect((component as any).visibleStepFields(form.steps[0]).map((field: any) => field.key)).toEqual(['title-guid', 'source-guid']);

    (component as any).openStep(2);
    expect((component as any).isStepOpen(2)).toBeTrue();
    expect((component as any).validationCssClass).toBe('validationSuccess');

    (component as any).savePartial();
    expect(formSubmissionService.buildSubmitModel).toHaveBeenCalled();
    expect(episerverFormService.savePartial).toHaveBeenCalled();

    watchVisibility$.next({ visibilityByGuid: { 'source-guid': true, 'hidden-guid': true }, visibilityByContentLinkId: {}, evaluations: [] });
    expect(formDependConditionsService.syncHiddenControls).toHaveBeenCalled();
  });

  it('handles invalid final submit and focuses the first invalid control', () => {
    const { component, documentStub, formSubmissionService, episerverFormService } = createComponent();
    formSubmissionService.validateStep.and.returnValue([{ result: { valid: false } }]);
    formSubmissionService.applyValidationResults.and.callFake((formGroup: FormGroup) => {
      formGroup.get('hidden-guid')?.setErrors({ required: true });
    });

    (component as any).submitFinal();

    expect(formSubmissionService.applyValidationResults).toHaveBeenCalled();
    expect(documentStub.getElementById).toHaveBeenCalledWith('hidden-guid');
    expect(episerverFormService.submitFinal).not.toHaveBeenCalled();
    expect((component as any).hasSubmitted).toBeTrue();
    expect((component as any).validationCssClass).toBe('validationFail');
  });

  it('shows warning state when load fails and when submit errors', () => {
    const loadFailure = createComponent(throwError(() => new Error('load failed')));
    expect((loadFailure.component as any).isLoading).toBeFalse();
    expect((loadFailure.component as any).statusMessage).toContain('Unable to load form');

    const successCase = createComponent();
    successCase.episerverFormService.savePartial.and.returnValue(throwError(() => ({ detail: 'Bad request' })));
    (successCase.component as any).savePartial();

    expect(successCase.formSubmissionService.applyServerValidation).toHaveBeenCalled();
    expect((successCase.component as any).isWarningStatus).toBeTrue();
    expect((successCase.component as any).statusMessage).toBe('Bad request');
  });
});
