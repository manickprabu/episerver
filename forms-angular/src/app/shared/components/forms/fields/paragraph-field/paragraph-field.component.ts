import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField } from '../../../../../core/models/form-schema.model';

@Component({
  selector: 'app-paragraph-field',
  standalone: true,
  templateUrl: './paragraph-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParagraphFieldComponent {
  readonly field = input.required<FormField>();
}
