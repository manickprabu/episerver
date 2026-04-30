import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormField } from '../../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../../services/form-schema-form.service';

@Component({
  selector: 'lib-hidden-field',
  standalone: false,
  templateUrl: './hidden-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HiddenFieldComponent {
  constructor(private readonly formSchemaFormService: FormSchemaFormService) {}

  readonly field = input.required<FormField>();
  readonly formGroup = input.required<FormGroup>();
  protected readonly control = computed(() => this.formSchemaFormService.controlFor(this.formGroup(), this.field()));
}
