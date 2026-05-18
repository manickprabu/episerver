import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormField } from '../../../../models/form-schema.model';

@Component({
  selector: 'lib-reset-button-field',
  standalone: false,
  templateUrl: './reset-button-field.component.html',
  styleUrls: ['./reset-button-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetButtonFieldComponent {
  @Input() field!: FormField;
  @Output() readonly triggered = new EventEmitter<void>();
}
