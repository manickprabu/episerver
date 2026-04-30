import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { IdentityInfo } from '../../sdk';
import { FormSchema } from '../../models/form-schema.model';

@Component({
  selector: 'lib-form-body',
  standalone: false,
  templateUrl: './form-body.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormBodyComponent {
  readonly form = input.required<FormSchema>();
  readonly identityInfo = input<IdentityInfo | undefined>(undefined);
  readonly baseUrl = input.required<string>();
  readonly history = input<unknown>(undefined);
  readonly currentPageUrl = input<string | undefined>(undefined);
}
