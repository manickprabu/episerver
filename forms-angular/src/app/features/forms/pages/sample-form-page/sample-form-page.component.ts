import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectFieldOption } from '../../../../episerver-forms/components/custom-controls/select-field/select-field.component';
import { EpiserverFormsModule } from '../../../../episerver-forms/episerver-forms.module';

@Component({
  selector: 'lib-sample-form-page',
  standalone: true,
  imports: [EpiserverFormsModule],
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
