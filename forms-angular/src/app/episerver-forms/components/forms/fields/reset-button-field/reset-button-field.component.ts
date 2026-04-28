import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormField } from '../../../../models/form-schema.model';

@Component({
  selector: 'lib-reset-button-field',
  standalone: true,
  templateUrl: './reset-button-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetButtonFieldComponent {
  readonly field = input.required<FormField>();
  readonly triggered = output<void>();
}
