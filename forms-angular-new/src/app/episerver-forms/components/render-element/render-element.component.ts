import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FormField } from '../../models/form-schema.model';

@Component({
  selector: 'lib-render-element',
  standalone: false,
  templateUrl: './render-element.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenderElementComponent {
  readonly field = input.required<FormField>();
  readonly formGroup = input.required<FormGroup>();
  readonly submitted = input(false);
  readonly submitDisabled = input(false);
  readonly reset = output<void>();
}
