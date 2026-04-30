import { ChangeDetectionStrategy, Component, OnChanges, SimpleChanges, input } from '@angular/core';

import { StepBuilderService, IdentityInfo } from '../../sdk';
import { FormSchema } from '../../models/form-schema.model';

@Component({
  selector: 'lib-form-container-block',
  standalone: false,
  templateUrl: './form-container-block.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormContainerBlockComponent implements OnChanges {
  readonly form = input.required<FormSchema>();
  readonly identityInfo = input<IdentityInfo | undefined>(undefined);
  readonly baseUrl = input.required<string>();
  readonly history = input<unknown>(undefined);
  readonly currentPageUrl = input<string | undefined>(undefined);

  protected builtForm?: FormSchema;

  constructor(private readonly stepBuilderService: StepBuilderService) {}

  ngOnChanges(_changes: SimpleChanges): void {
    this.builtForm = this.stepBuilderService.buildForm(this.form()) as FormSchema;
  }
}
