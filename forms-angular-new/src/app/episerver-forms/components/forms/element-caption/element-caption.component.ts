import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormField } from '../../../models/form-schema.model';

@Component({
  selector: 'lib-element-caption',
  standalone: false,
  templateUrl: './element-caption.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElementCaptionComponent {
  readonly field = input.required<FormField>();
  readonly forId = input<string | null>(null);
  readonly variant = input<'label' | 'legend' | 'div'>('label');
}
