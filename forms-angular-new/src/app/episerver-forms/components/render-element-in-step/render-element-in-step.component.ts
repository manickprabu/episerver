import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FormField } from '../../models/form-schema.model';

@Component({
  selector: 'lib-render-element-in-step',
  standalone: false,
  templateUrl: './render-element-in-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenderElementInStepComponent {
  @Input() elements!: FormField[];
  @Input() formGroup!: FormGroup;
  @Input() submitted = false;
  @Input() submitDisabled = false;
  @Input() inactiveElements: string[] = [];
  @Output() readonly reset = new EventEmitter<void>();
}
