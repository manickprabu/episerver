import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SelectFieldComponent as CustomSelectFieldComponent } from './components/custom-controls/select-field/select-field.component';
import { TextFieldComponent as CustomTextFieldComponent } from './components/custom-controls/text-field/text-field.component';
import { TextareaFieldComponent as CustomTextareaFieldComponent } from './components/custom-controls/textarea-field/textarea-field.component';
import { FormLoginComponent } from './components/form-login/form-login.component';
import { DynamicFieldComponent } from './components/forms/dynamic-field/dynamic-field.component';
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

const EPISERVER_FORMS_COMPONENTS = [
  FormLoginComponent,
  DynamicFieldComponent,
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
  imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  exports: [CommonModule, FormsModule, ReactiveFormsModule, ...EPISERVER_FORMS_COMPONENTS]
})
export class EpiserverFormsModule {}
