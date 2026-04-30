import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { EpiserverFormsSdkModule } from './sdk';
import { FormBodyComponent } from './components/form-body/form-body.component';
import { FormContainerBlockComponent } from './components/form-container-block/form-container-block.component';
import { FormComponent } from './components/form/form.component';
import { SelectFieldComponent as CustomSelectFieldComponent } from './components/custom-controls/select-field/select-field.component';
import { TextFieldComponent as CustomTextFieldComponent } from './components/custom-controls/text-field/text-field.component';
import { TextareaFieldComponent as CustomTextareaFieldComponent } from './components/custom-controls/textarea-field/textarea-field.component';
import { FormLoginComponent } from './components/form-login/form-login.component';
import { RenderElementComponent } from './components/render-element/render-element.component';
import { RenderElementInStepComponent } from './components/render-element-in-step/render-element-in-step.component';
import { DynamicFieldComponent } from './components/forms/dynamic-field/dynamic-field.component';
import { DataListComponent } from './components/forms/data-list/data-list.component';
import { ElementCaptionComponent } from './components/forms/element-caption/element-caption.component';
import { ElementWrapperComponent } from './components/forms/element-wrapper/element-wrapper.component';
import { ChoiceFieldComponent } from './components/forms/fields/choice-field/choice-field.component';
import { FileUploadFieldComponent } from './components/forms/fields/file-upload-field/file-upload-field.component';
import { FormStepFieldComponent } from './components/forms/fields/form-step-field/form-step-field.component';
import { HiddenFieldComponent } from './components/forms/fields/hidden-field/hidden-field.component';
import { ImageChoiceFieldComponent } from './components/forms/fields/image-choice-field/image-choice-field.component';
import { NumberFieldComponent } from './components/forms/fields/number-field/number-field.component';
import { ParagraphFieldComponent } from './components/forms/fields/paragraph-field/paragraph-field.component';
import { RangeFieldComponent } from './components/forms/fields/range-field/range-field.component';
import { ResetButtonFieldComponent } from './components/forms/fields/reset-button-field/reset-button-field.component';
import { SelectFieldComponent } from './components/forms/fields/select-field/select-field.component';
import { SubmitButtonFieldComponent } from './components/forms/fields/submit-button-field/submit-button-field.component';
import { TextFieldComponent } from './components/forms/fields/text-field/text-field.component';
import { TextareaFieldComponent } from './components/forms/fields/textarea-field/textarea-field.component';
import { UrlFieldComponent } from './components/forms/fields/url-field/url-field.component';
import { FormContainerComponent } from './components/forms/form-container/form-container.component';
import { FormStepNavigationComponent } from './components/forms/form-step-navigation/form-step-navigation.component';
import { ValidationMessageComponent } from './components/forms/validation-message/validation-message.component';
import { DynamicFormAdapterService } from './services/dynamic-form-adapter.service';
import { FormAuthService } from './services/form-auth.service';
import { FormConfirmationService } from './services/form-confirmation.service';
import { FormLoaderService } from './services/form-loader.service';
import { FormLoginStateService } from './services/form-login-state.service';
import { FormNavigationService } from './services/form-navigation.service';
import { FormSchemaFormService } from './services/form-schema-form.service';
import { FormSubmissionService } from './services/form-submission.service';

const EPISERVER_FORMS_COMPONENTS = [
  FormComponent,
  FormContainerBlockComponent,
  FormBodyComponent,
  RenderElementComponent,
  RenderElementInStepComponent,
  FormLoginComponent,
  DynamicFieldComponent,
  DataListComponent,
  ElementCaptionComponent,
  ElementWrapperComponent,
  ChoiceFieldComponent,
  FileUploadFieldComponent,
  FormStepFieldComponent,
  HiddenFieldComponent,
  ImageChoiceFieldComponent,
  NumberFieldComponent,
  ParagraphFieldComponent,
  RangeFieldComponent,
  ResetButtonFieldComponent,
  SelectFieldComponent,
  SubmitButtonFieldComponent,
  TextFieldComponent,
  TextareaFieldComponent,
  UrlFieldComponent,
  FormContainerComponent,
  FormStepNavigationComponent,
  ValidationMessageComponent,
  CustomSelectFieldComponent,
  CustomTextFieldComponent,
  CustomTextareaFieldComponent
] as const;

@NgModule({
  declarations: [...EPISERVER_FORMS_COMPONENTS],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule, EpiserverFormsSdkModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, ...EPISERVER_FORMS_COMPONENTS],
  providers: [
    DynamicFormAdapterService,
    FormAuthService,
    FormConfirmationService,
    FormLoaderService,
    FormLoginStateService,
    FormNavigationService,
    FormSchemaFormService,
    FormSubmissionService
  ]
})
export class EpiserverFormsModule {}
