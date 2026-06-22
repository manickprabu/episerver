import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FormField } from '../../models/form-schema.model';

@Component({
  selector: 'lib-render-element',
  standalone: false,
  templateUrl: './render-element.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenderElementComponent {
  @Input() field!: FormField;
  @Input() formGroup!: FormGroup;
  @Input() submitted = false;
  @Input() submitDisabled = false;
  @Input() apiBaseURLPrefix = '';
  @Output() readonly reset = new EventEmitter<void>();
}
