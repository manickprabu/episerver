import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FormField } from '../../models/form-schema.model';

@Component({
  selector: 'lib-render-element-in-step',
  standalone: false,
  templateUrl: './render-element-in-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenderElementInStepComponent {
  readonly elements = input.required<FormField[]>();
  readonly formGroup = input.required<FormGroup>();
  readonly submitted = input(false);
  readonly submitDisabled = input(false);
  readonly inactiveElements = input<string[]>([]);
  readonly reset = output<void>();
}
