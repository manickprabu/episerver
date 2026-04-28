import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormField } from '../../../models/form-schema.model';
import { ChoiceFieldComponent } from '../fields/choice-field/choice-field.component';
import { FileUploadFieldComponent } from '../fields/file-upload-field/file-upload-field.component';
import { FormStepFieldComponent } from '../fields/form-step-field/form-step-field.component';
import { HiddenFieldComponent } from '../fields/hidden-field/hidden-field.component';
import { ImageChoiceFieldComponent } from '../fields/image-choice-field/image-choice-field.component';
import { NumberFieldComponent } from '../fields/number-field/number-field.component';
import { ParagraphFieldComponent } from '../fields/paragraph-field/paragraph-field.component';
import { RangeFieldComponent } from '../fields/range-field/range-field.component';
import { ResetButtonFieldComponent } from '../fields/reset-button-field/reset-button-field.component';
import { SelectFieldComponent } from '../fields/select-field/select-field.component';
import { SubmitButtonFieldComponent } from '../fields/submit-button-field/submit-button-field.component';
import { TextFieldComponent } from '../fields/text-field/text-field.component';
import { TextareaFieldComponent } from '../fields/textarea-field/textarea-field.component';
import { UrlFieldComponent } from '../fields/url-field/url-field.component';

@Component({
  selector: 'lib-dynamic-field',
  standalone: true,
  imports: [
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
    UrlFieldComponent
  ],
  templateUrl: './dynamic-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DynamicFieldComponent {
  readonly field = input.required<FormField>();
  readonly formGroup = input.required<FormGroup>();
  readonly submitted = input(false);
  readonly submitDisabled = input(false);
  readonly reset = output<void>();
}
