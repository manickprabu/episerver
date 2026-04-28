import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField } from '../../../../models/form-schema.model';

@Component({
  selector: 'lib-submit-button-field',
  standalone: true,
  templateUrl: './submit-button-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubmitButtonFieldComponent {
  readonly field = input.required<FormField>();
  readonly disabled = input(false);
}
