import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { FormField } from '../../../models/form-schema.model';

@Component({
  selector: 'lib-data-list',
  standalone: false,
  templateUrl: './data-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataListComponent {
  @Input() field!: FormField;
}
