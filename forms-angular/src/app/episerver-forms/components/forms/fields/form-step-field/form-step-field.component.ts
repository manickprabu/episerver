import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField } from '../../../../models/form-schema.model';

@Component({
  selector: 'lib-form-step-field',
  standalone: true,
  templateUrl: './form-step-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormStepFieldComponent {
  readonly field = input.required<FormField>();
}
