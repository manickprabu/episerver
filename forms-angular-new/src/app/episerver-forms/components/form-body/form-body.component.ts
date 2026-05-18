import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { IdentityInfo } from '../../episerver-sdk';
import { FormSchema } from '../../models/form-schema.model';

@Component({
  selector: 'lib-form-body',
  standalone: false,
  templateUrl: './form-body.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormBodyComponent {
  @Input() form!: FormSchema;
  @Input() identityInfo: IdentityInfo | undefined = undefined;
  @Input() baseUrl!: string;
  @Input() history: unknown = undefined;
  @Input() currentPageUrl: string | undefined = undefined;
}
