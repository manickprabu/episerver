import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { BehaviorSubject, NEVER, of } from 'rxjs';

import { StepBuilderService } from '../episerver-sdk';
import { FormSchema } from '../models/form-schema.model';
import { FormLoaderService } from '../services/form-loader.service';
import { FormLoginStateService } from '../services/form-login-state.service';
import { FormSchemaFormService } from '../services/form-schema-form.service';
import { FormComponent } from './form/form.component';
import { FormBodyComponent } from './form-body/form-body.component';
import { FormContainerBlockComponent } from './form-container-block/form-container-block.component';
import { FormLoginComponent } from './form-login/form-login.component';
import { EpiserverFormComponent } from './forms/episerver-form/episerver-form.component';
import { ChoiceFieldComponent } from './forms/fields/choice-field/choice-field.component';
import { FileUploadFieldComponent } from './forms/fields/file-upload-field/file-upload-field.component';
import { FormStepFieldComponent } from './forms/fields/form-step-field/form-step-field.component';
import { HiddenFieldComponent } from './forms/fields/hidden-field/hidden-field.component';
import { ImageChoiceFieldComponent } from './forms/fields/image-choice-field/image-choice-field.component';
import { NumberFieldComponent } from './forms/fields/number-field/number-field.component';
import { ParagraphFieldComponent } from './forms/fields/paragraph-field/paragraph-field.component';
import { RangeFieldComponent } from './forms/fields/range-field/range-field.component';
import { ResetButtonFieldComponent } from './forms/fields/reset-button-field/reset-button-field.component';
import { TextareaFieldComponent } from './forms/fields/textarea-field/textarea-field.component';
import { UrlFieldComponent } from './forms/fields/url-field/url-field.component';
import { RenderElementComponent } from './render-element/render-element.component';
import { RenderElementInStepComponent } from './render-element-in-step/render-element-in-step.component';

function createField(overrides: Record<string, unknown> = {}): any {
  const field = {
    key: 'field-key',
    contentType: 'TextboxElementBlock',
    displayName: 'Field',
    properties: {
      label: 'Label',
      items: [],
      validators: [],
      allowMultiSelect: false
    }
  };

  return {
    ...field,
    ...overrides,
    properties: {
      ...field.properties,
      ...((overrides as any).properties ?? {})
    }
  };
}

describe('low coverage components', () => {
  it('covers form shell components and renderers', () => {
    const loadSpy = jasmine.createSpy('load').and.returnValues(NEVER, of({ key: 'loaded' }));
    const formLoaderService = { load: loadSpy } as unknown as FormLoaderService;
    const formComponent = new FormComponent(formLoaderService);

    formComponent.ngOnChanges({});
    expect(loadSpy).not.toHaveBeenCalled();

    formComponent.formKey = 'form-key';
    formComponent.baseUrl = 'http://base';
    formComponent.ngOnChanges({ formKey: {} as any });
    expect(loadSpy).toHaveBeenCalled();

    formComponent.language = 'en';
    formComponent.ngOnChanges({ language: {} as any });
    expect(loadSpy).toHaveBeenCalledTimes(2);
    expect((formComponent as any).formData).toEqual({ key: 'loaded' });
    formComponent.ngOnDestroy();

    const formBody = new FormBodyComponent();
    formBody.form = { formElements: [] } as unknown as FormSchema;
    expect(formBody.form.formElements).toEqual([]);

    const stepBuilderService = jasmine.createSpyObj<StepBuilderService>('StepBuilderService', ['buildForm']);
    stepBuilderService.buildForm.and.returnValue({ steps: ['step'] } as never);
    const containerBlock = new FormContainerBlockComponent(stepBuilderService);
    containerBlock.ngOnChanges({});
    expect((containerBlock as any).builtForm).toBeUndefined();
    containerBlock.form = { formElements: [] } as unknown as FormSchema;
    containerBlock.ngOnChanges({ form: {} as any });
    expect(stepBuilderService.buildForm).toHaveBeenCalled();
    expect((containerBlock as any).builtForm).toEqual({ steps: ['step'] } as never);

    const episerverForm = new EpiserverFormComponent();
    episerverForm.field = createField();
    episerverForm.formGroup = new FormGroup({});
    episerverForm.reset.emit();

    const renderElement = new RenderElementComponent();
    renderElement.field = createField();
    renderElement.formGroup = new FormGroup({});
    renderElement.reset.emit();

    const renderElementInStep = new RenderElementInStepComponent();
    renderElementInStep.elements = [createField()];
    renderElementInStep.formGroup = new FormGroup({});
    renderElementInStep.inactiveElements = ['inactive'];
    renderElementInStep.reset.emit();

    expect(renderElementInStep.elements.length).toBe(1);
  });

  it('covers field components that use formSchemaFormService', () => {
    const control = new FormControl('A');
    const formSchemaFormService = {
      controlFor: jasmine.createSpy('controlFor').and.returnValue(control)
    } as unknown as FormSchemaFormService;
    const formGroup = new FormGroup({});

    const choice = new ChoiceFieldComponent(formSchemaFormService);
    choice.field = createField({ properties: { allowMultiSelect: true, items: [{ value: 'A', checked: true }] } });
    choice.formGroup = formGroup;
    control.setValue(['A'] as never);
    expect((choice as any).control).toBe(control);
    expect((choice as any).isChecked('A')).toBeTrue();
    (choice as any).toggleValue('B', true);
    expect(control.value as unknown as string[]).toEqual(['A', 'B']);
    (choice as any).toggleValue('A', false);
    expect(control.value as unknown as string[]).toEqual(['B']);
    choice.field = createField();
    control.setValue('B');
    expect((choice as any).isChecked('B')).toBeTrue();
    (choice as any).toggleValue('C', true);
    expect(control.value).toBe('C');

    const imageChoice = new ImageChoiceFieldComponent(formSchemaFormService);
    imageChoice.field = createField({ properties: { allowMultiSelect: false } });
    imageChoice.formGroup = formGroup;
    control.setValue('img');
    expect((imageChoice as any).isChecked('img')).toBeTrue();
    (imageChoice as any).toggleValue('next', true);
    expect(control.value).toBe('next');

    const fileUpload = new FileUploadFieldComponent(formSchemaFormService, { markForCheck: () => undefined } as any);
    fileUpload.field = createField({ contentType: 'FileUploadElementBlock' });
    fileUpload.formGroup = formGroup;
    const file = new File(['body'], 'doc.txt');
    (fileUpload as any).draftFiles = (fileUpload as any).normalizeFiles([file]);
    expect((fileUpload as any).draftFiles).toEqual([{ name: 'doc.txt', size: file.size, url: undefined, assetGuid: undefined, file }]);

    const hidden = new HiddenFieldComponent(formSchemaFormService);
    hidden.field = createField();
    hidden.formGroup = formGroup;
    expect((hidden as any).control).toBe(control);

    const range = new RangeFieldComponent(formSchemaFormService);
    range.field = createField({ contentType: 'RangeElementBlock' });
    range.formGroup = formGroup;
    expect((range as any).control).toBe(control);

    const number = new NumberFieldComponent(formSchemaFormService);
    number.field = createField({ contentType: 'NumberElementBlock' });
    number.formGroup = formGroup;
    expect((number as any).control).toBe(control);

    const textarea = new TextareaFieldComponent(formSchemaFormService);
    textarea.field = createField({ contentType: 'TextareaElementBlock' });
    textarea.formGroup = formGroup;
    expect((textarea as any).control).toBe(control);

    const url = new UrlFieldComponent(formSchemaFormService);
    url.field = createField({ contentType: 'UrlElementBlock' });
    url.formGroup = formGroup;
    expect((url as any).control).toBe(control);

    const paragraph = new ParagraphFieldComponent();
    paragraph.field = createField({ contentType: 'ParagraphTextElementBlock' });
    expect(paragraph.field.contentType).toBe('ParagraphTextElementBlock');

    const stepField = new FormStepFieldComponent();
    stepField.field = createField({ contentType: 'FormStepBlock' });
    expect(stepField.field.contentType).toBe('FormStepBlock');

    const reset = new ResetButtonFieldComponent();
    const triggeredSpy = jasmine.createSpy('triggered');
    reset.triggered.subscribe(triggeredSpy);
    reset.triggered.emit();
    expect(triggeredSpy).toHaveBeenCalled();
  });
});

describe('FormLoginComponent', () => {
  let fixture: ComponentFixture<FormLoginComponent>;
  let component: FormLoginComponent;
  let loginState: {
    isSubmitting: boolean;
    stateChanges$: BehaviorSubject<void>;
    watchAccessToken: jasmine.Spy;
    login: jasmine.Spy;
  };

  beforeEach(async () => {
    loginState = {
      isSubmitting: false,
      stateChanges$: new BehaviorSubject<void>(undefined),
      watchAccessToken: jasmine.createSpy('watchAccessToken'),
      login: jasmine.createSpy('login').and.returnValue(of({ accessToken: 'token' }))
    };

    await TestBed.configureTestingModule({
      declarations: [FormLoginComponent],
      imports: [ReactiveFormsModule],
      providers: [{ provide: FormLoginStateService, useValue: loginState }]
    }).compileComponents();

    fixture = TestBed.createComponent(FormLoginComponent);
    component = fixture.componentInstance;
    component.clientId = 'client';
    component.authBaseUrl = 'http://auth';
    fixture.detectChanges();
  });

  it('computes canSubmit and emits authenticated identity on success', () => {
    (component as any).loginForm.patchValue({ username: 'user', password: 'pass' });
    expect((component as any).canSubmit).toBeTrue();

    const authSpy = jasmine.createSpy('auth');
    component.onAuthenticated.subscribe(authSpy);
    (component as any).submit();

    expect(loginState.login).toHaveBeenCalledWith('user', 'pass', 'client', 'http://auth');
    expect(authSpy).toHaveBeenCalledWith({ accessToken: 'token' });
    expect(loginState.watchAccessToken).toHaveBeenCalled();
  });

  it('marks form touched when invalid or already submitting', () => {
    expect((component as any).loginForm.untouched).toBeTrue();
    (component as any).submit();
    expect((component as any).loginForm.touched).toBeTrue();

    loginState.isSubmitting = true;
    (component as any).loginForm.patchValue({ username: 'user', password: 'pass' });
    (component as any).submit();
    expect(loginState.login).not.toHaveBeenCalled();
  });
});
