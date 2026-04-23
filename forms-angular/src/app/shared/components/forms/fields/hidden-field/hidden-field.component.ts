import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../../../../../core/models/form-schema.model';
import { FormSchemaFormService } from '../../../../../core/services/form-schema-form.service';

@Component({
  selector: 'app-hidden-field',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './hidden-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HiddenFieldComponent {
  private readonly formSchemaFormService = inject(FormSchemaFormService);
  readonly field = input.required<FormField>();
  readonly formGroup = input.required<FormGroup>();
  protected readonly control = computed(() => this.formSchemaFormService.controlFor(this.formGroup(), this.field()));
}
