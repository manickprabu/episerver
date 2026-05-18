import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
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
export class FormComponent implements OnChanges, OnDestroy {
  @Input() formKey!: string;
  @Input() language: string | undefined = undefined;
  @Input() baseUrl!: string;
  @Input() identityInfo: IdentityInfo | undefined = undefined;
  @Input() history: unknown = undefined;
  @Input() currentPageUrl: string | undefined = undefined;
  @Input() optiGraphUrl: string | undefined = undefined;

  protected formData?: FormSchema;
  private subscription?: Subscription;

  constructor(private readonly formLoaderService: FormLoaderService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.formKey || !this.baseUrl) {
      return;
    }

    if (!changes['formKey'] && !changes['language'] && !changes['baseUrl'] && !changes['optiGraphUrl']) {
      return;
    }

    this.subscription?.unsubscribe();
    this.subscription = this.formLoaderService
      .load({
        formKey: this.formKey,
        language: this.language,
        baseUrl: this.baseUrl,
        optiGraphUrl: this.optiGraphUrl
      })
      .subscribe(formData => {
        this.formData = formData;
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
