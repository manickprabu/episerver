import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormField } from '../../../../../core/models/form-schema.model';
import { FormSchemaFormService } from '../../../../../core/services/form-schema-form.service';
import { ValidationMessageComponent } from '../../validation-message/validation-message.component';

@Component({
  selector: 'app-text-field',
  standalone: true,
  imports: [ReactiveFormsModule, ValidationMessageComponent],
  templateUrl: './text-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextFieldComponent {
  private readonly formSchemaFormService = inject(FormSchemaFormService);
  readonly field = input.required<FormField>();
  readonly formGroup = input.required<FormGroup>();
  readonly submitted = input(false);
  protected readonly control = computed(() => this.formSchemaFormService.controlFor(this.formGroup(), this.field()));
}
