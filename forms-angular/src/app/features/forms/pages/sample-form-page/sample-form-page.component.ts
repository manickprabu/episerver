import { CommonModule } from '@angular/common';
import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-sample-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './sample-form-page.component.html',
  styleUrl: './sample-form-page.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SampleFormPageComponent implements OnInit {
  form!: FormGroup;

  readonly categoryOptions: SelectOption[] = [
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
