import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SelectFieldComponent, SelectFieldOption } from '../../../../shared/components/custom-controls/select-field/select-field.component';
import { TextFieldComponent } from '../../../../shared/components/custom-controls/text-field/text-field.component';
import { TextareaFieldComponent } from '../../../../shared/components/custom-controls/textarea-field/textarea-field.component';

@Component({
  selector: 'app-sample-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TextFieldComponent, TextareaFieldComponent, SelectFieldComponent],
  templateUrl: './sample-form-page.component.html',
  styleUrl: './sample-form-page.component.scss'
})
export class SampleFormPageComponent implements OnInit {
  form!: FormGroup;

  readonly categoryOptions: SelectFieldOption[] = [
    { label: 'General', value: 'general' },
    { label: 'Support', value: 'support' },
    { label: 'Feedback', value: 'feedback' }
  ];

  constructor(private readonly formBuilder: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.minLength(10)],
      category: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    console.log('Sample form value', this.form.value);
  }

  protected hasError(controlName: 'name' | 'description' | 'category', errorKey: 'required' | 'minlength'): boolean {
    const control = this.form.get(controlName);
    return !!control && control.hasError(errorKey) && (control.touched || control.dirty);
  }
}
