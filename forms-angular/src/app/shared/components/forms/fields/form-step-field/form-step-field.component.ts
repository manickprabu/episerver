import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField } from '../../../../../core/models/form-schema.model';

@Component({
  selector: 'app-form-step-field',
  standalone: true,
  templateUrl: './form-step-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormStepFieldComponent {
  readonly field = input.required<FormField>();
}
