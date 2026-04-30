import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormField } from '../../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../../services/form-schema-form.service';

@Component({
  selector: 'lib-range-field',
  standalone: false,
  templateUrl: './range-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RangeFieldComponent {
  constructor(private readonly formSchemaFormService: FormSchemaFormService) {}

  readonly field = input.required<FormField>();
  readonly formGroup = input.required<FormGroup>();
  readonly submitted = input(false);
  protected readonly control = computed(() => this.formSchemaFormService.controlFor(this.formGroup(), this.field()));
}
