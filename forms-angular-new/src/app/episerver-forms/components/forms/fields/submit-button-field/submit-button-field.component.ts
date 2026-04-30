import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField } from '../../../../models/form-schema.model';

@Component({
  selector: 'lib-submit-button-field',
  standalone: false,
  templateUrl: './submit-button-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubmitButtonFieldComponent {
  readonly field = input.required<FormField>();
  readonly disabled = input(false);
}
