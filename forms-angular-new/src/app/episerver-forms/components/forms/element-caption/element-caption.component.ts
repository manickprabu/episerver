import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormField } from '../../../models/form-schema.model';

@Component({
  selector: 'lib-element-caption',
  standalone: false,
  templateUrl: './element-caption.component.html',
  styleUrls: ['./element-caption.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElementCaptionComponent {
  @Input() field!: FormField;
  @Input() forId: string | null = null;
  @Input() variant: 'label' | 'legend' | 'div' = 'label';
}
