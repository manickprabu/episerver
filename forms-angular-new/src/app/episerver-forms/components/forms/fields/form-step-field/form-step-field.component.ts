import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormField } from '../../../../models/form-schema.model';

@Component({
  selector: 'lib-form-step-field',
  standalone: false,
  templateUrl: './form-step-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormStepFieldComponent {
  @Input() field!: FormField;
}
