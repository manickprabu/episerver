import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormField } from '../../../../models/form-schema.model';

@Component({
  selector: 'lib-paragraph-field',
  standalone: false,
  templateUrl: './paragraph-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParagraphFieldComponent {
  @Input() field!: FormField;
}
