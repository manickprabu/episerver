import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, input } from '@angular/core';
import { Subscription } from 'rxjs';

import { IdentityInfo } from '../../episerver-sdk';
import { FormSchema } from '../../models/form-schema.model';
import { FormLoaderService } from '../../services/form-loader.service';

@Component({
  selector: 'lib-form',
  standalone: false,
  templateUrl: './form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormComponent implements OnInit, OnDestroy {
  readonly formKey = input.required<string>();
  readonly language = input<string | undefined>(undefined);
  readonly baseUrl = input.required<string>();
  readonly identityInfo = input<IdentityInfo | undefined>(undefined);
  readonly history = input<unknown>(undefined);
  readonly currentPageUrl = input<string | undefined>(undefined);
  readonly optiGraphUrl = input<string | undefined>(undefined);

  protected formData?: FormSchema;
  private subscription?: Subscription;

  constructor(private readonly formLoaderService: FormLoaderService) {}

  ngOnInit(): void {
    this.subscription = this.formLoaderService
      .load({
        formKey: this.formKey(),
        language: this.language(),
        baseUrl: this.baseUrl(),
        optiGraphUrl: this.optiGraphUrl()
      })
      .subscribe((formData) => {
        this.formData = formData;
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
