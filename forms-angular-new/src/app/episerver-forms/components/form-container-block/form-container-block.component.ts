import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { StepBuilderService, IdentityInfo } from '../../episerver-sdk';
import { FormSchema } from '../../models/form-schema.model';

@Component({
  selector: 'lib-form-container-block',
  standalone: false,
  templateUrl: './form-container-block.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormContainerBlockComponent implements OnChanges {
  @Input() form!: FormSchema;
  @Input() identityInfo: IdentityInfo | undefined = undefined;
  @Input() baseUrl!: string;
  @Input() history: unknown = undefined;
  @Input() currentPageUrl: string | undefined = undefined;

  protected builtForm?: FormSchema;

  constructor(private readonly stepBuilderService: StepBuilderService) {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.form) {
      return;
    }

    this.builtForm = this.stepBuilderService.buildForm(this.form) as FormSchema;
  }
}
