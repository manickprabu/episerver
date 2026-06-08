import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { ElementCaptionComponent } from '../../element-caption/element-caption.component';
import { ElementWrapperComponent } from '../../element-wrapper/element-wrapper.component';
import { ValidationMessageComponent } from '../../validation-message/validation-message.component';
import { FormField } from '../../../../models/form-schema.model';
import { FormSchemaFormService } from '../../../../services/form-schema-form.service';
import { FileUploadFieldComponent } from './file-upload-field.component';

function createField(key: string, label: string): FormField {
  return {
    key,
    contentType: 'FileUploadElementBlock',
    displayName: label,
    locale: 'en',
    localizations: {},
    properties: {
      label,
      description: '',
      validators: []
    }
  } as FormField;
}

describe('FileUploadFieldComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [
        TestHostComponent,
        FileUploadFieldComponent,
        ElementWrapperComponent,
        ElementCaptionComponent,
        ValidationMessageComponent
      ],
      providers: [
        {
          provide: FormSchemaFormService,
          useValue: {
            controlFor: (formGroup: FormGroup, field: FormField) => formGroup.get(field.key),
            getValidationMessage: () => ''
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('confirms selected files and keeps each upload question independent', () => {
    const [resumeUpload, portfolioUpload] = Array.from(fixture.nativeElement.querySelectorAll('.formFileUpload')) as HTMLElement[];
    const resumeInput = openModal(resumeUpload);

    selectFiles(resumeInput, createFile('resume.pdf', 1024), createFile('cover-letter.pdf', 2048));
    fixture.detectChanges();

    expect(resumeUpload.textContent).toContain('resume.pdf');
    expect(resumeUpload.textContent).toContain('cover-letter.pdf');

    click(resumeUpload, '.formFileUpload__PrimaryAction');
    fixture.detectChanges();

    expect(resumeUpload.textContent).toContain('resume.pdf');
    expect(resumeUpload.textContent).toContain('cover-letter.pdf');
    expect(portfolioUpload.textContent).not.toContain('resume.pdf');

    const portfolioInput = openModal(portfolioUpload);
    selectFiles(portfolioInput, createFile('portfolio.zip', 4096));
    fixture.detectChanges();
    click(portfolioUpload, '.formFileUpload__PrimaryAction');
    fixture.detectChanges();

    expect((fixture.componentInstance.formGroup.get('resume')?.value as unknown[]).length).toBe(2);
    expect((fixture.componentInstance.formGroup.get('portfolio')?.value as unknown[]).length).toBe(1);

    click(resumeUpload, '.formFileUpload__Remove');
    fixture.detectChanges();

    expect((fixture.componentInstance.formGroup.get('resume')?.value as unknown[]).length).toBe(1);
    expect((fixture.componentInstance.formGroup.get('portfolio')?.value as unknown[]).length).toBe(1);

    openModal(resumeUpload);
    fixture.detectChanges();
    expect(resumeUpload.querySelectorAll('.formFileUpload__DraftItem').length).toBe(1);
  });

  it('shows a validation error when more than five files are selected', () => {
    const resumeUpload = fixture.nativeElement.querySelector('.formFileUpload') as HTMLElement;
    const resumeInput = openModal(resumeUpload);

    selectFiles(
      resumeInput,
      createFile('1.txt', 100),
      createFile('2.txt', 100),
      createFile('3.txt', 100),
      createFile('4.txt', 100),
      createFile('5.txt', 100),
      createFile('6.txt', 100)
    );
    fixture.detectChanges();

    expect(resumeUpload.textContent).toContain('You can upload up to 5 files.');
    expect((fixture.componentInstance.formGroup.get('resume')?.value as unknown[]).length).toBe(0);
    expect(resumeUpload.querySelectorAll('.formFileUpload__DraftItem').length).toBe(0);
  });

  it('shows a validation error when a selected file exceeds 5MB', () => {
    const resumeUpload = fixture.nativeElement.querySelector('.formFileUpload') as HTMLElement;
    const resumeInput = openModal(resumeUpload);

    selectFiles(resumeInput, createFile('too-large.mov', 5 * 1024 * 1024 + 1));
    fixture.detectChanges();

    expect(resumeUpload.textContent).toContain('too-large.mov exceeds the 5MB limit.');
    expect((fixture.componentInstance.formGroup.get('resume')?.value as unknown[]).length).toBe(0);
  });

  it('disables the choose-files control when the upload reaches the max file count', () => {
    const resumeUpload = fixture.nativeElement.querySelector('.formFileUpload') as HTMLElement;
    const resumeInput = openModal(resumeUpload);

    selectFiles(
      resumeInput,
      createFile('1.txt', 100),
      createFile('2.txt', 100),
      createFile('3.txt', 100),
      createFile('4.txt', 100),
      createFile('5.txt', 100)
    );
    fixture.detectChanges();

    const updatedInput = resumeUpload.querySelector('.formFileUpload__Input') as HTMLInputElement;
    expect(updatedInput.disabled).toBeTrue();
    expect(resumeUpload.textContent).toContain('Maximum 5 files selected. Remove a file to add another.');
  });
});

@Component({
  template: `
    <lib-file-upload-field [field]="resumeField" [formGroup]="formGroup"></lib-file-upload-field>
    <lib-file-upload-field [field]="portfolioField" [formGroup]="formGroup"></lib-file-upload-field>
  `,
  standalone: false
})
class TestHostComponent {
  readonly formGroup = new FormGroup({
    resume: new FormControl([]),
    portfolio: new FormControl([])
  });

  readonly resumeField = createField('resume', 'Resume');
  readonly portfolioField = createField('portfolio', 'Portfolio');
}

function openModal(host: HTMLElement): HTMLInputElement {
  click(host, '.formFileUpload__Trigger');
  return host.querySelector('.formFileUpload__Input') as HTMLInputElement;
}

function click(host: HTMLElement, selector: string): void {
  const button = host.querySelector(selector) as HTMLButtonElement;
  button.click();
}

function selectFiles(input: HTMLInputElement, ...files: File[]): void {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: files
  });
  input.dispatchEvent(new Event('change'));
}

function createFile(name: string, sizeInBytes: number): File {
  return new File([new Uint8Array(sizeInBytes)], name, { type: 'application/octet-stream' });
}
