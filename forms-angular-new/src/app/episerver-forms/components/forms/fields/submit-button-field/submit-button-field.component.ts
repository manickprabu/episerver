import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormField } from '../../../../models/form-schema.model';

@Component({
  selector: 'lib-submit-button-field',
  standalone: false,
  templateUrl: './submit-button-field.component.html',
  styleUrls: ['./submit-button-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubmitButtonFieldComponent {
  @Input() field!: FormField;
  @Input() disabled = false;
}
