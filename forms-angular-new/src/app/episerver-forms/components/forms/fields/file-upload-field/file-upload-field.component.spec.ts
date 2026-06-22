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
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [FileUploadFieldComponent, ElementWrapperComponent, ElementCaptionComponent, ValidationMessageComponent],
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
  });

  it('confirms selected files and keeps each upload question independent', () => {
    const formGroup = new FormGroup({
      resume: new FormControl([]),
      portfolio: new FormControl([])
    });
    const resumeFixture = createComponent(createField('resume', 'Resume'), formGroup);
    const portfolioFixture = createComponent(createField('portfolio', 'Portfolio'), formGroup);

    const resumeInput = openModal(resumeFixture);
    selectFiles(resumeInput, createFile('resume.pdf', 1024), createFile('cover-letter.pdf', 2048));
    resumeFixture.detectChanges();

    expect(resumeFixture.nativeElement.textContent).toContain('resume.pdf');
    expect(resumeFixture.nativeElement.textContent).toContain('cover-letter.pdf');

    click(resumeFixture, '.formFileUpload__PrimaryAction');
    resumeFixture.detectChanges();
    portfolioFixture.detectChanges();

    expect(resumeFixture.nativeElement.textContent).toContain('resume.pdf');
    expect(resumeFixture.nativeElement.textContent).toContain('cover-letter.pdf');
    expect(portfolioFixture.nativeElement.textContent).not.toContain('resume.pdf');

    const portfolioInput = openModal(portfolioFixture);
    selectFiles(portfolioInput, createFile('portfolio.zip', 4096));
    portfolioFixture.detectChanges();
    click(portfolioFixture, '.formFileUpload__PrimaryAction');
    resumeFixture.detectChanges();
    portfolioFixture.detectChanges();

    expect((formGroup.get('resume')?.value as unknown[]).length).toBe(2);
    expect((formGroup.get('portfolio')?.value as unknown[]).length).toBe(1);
    expect((formGroup.get('resume')?.value as Array<{ size: number }>)[0].size).toBe(1024);

    click(resumeFixture, '.formFileUpload__Remove');
    resumeFixture.detectChanges();
    portfolioFixture.detectChanges();

    expect((formGroup.get('resume')?.value as unknown[]).length).toBe(1);
    expect((formGroup.get('portfolio')?.value as unknown[]).length).toBe(1);

    openModal(resumeFixture);
    resumeFixture.detectChanges();
    expect(resumeFixture.nativeElement.querySelectorAll('.formFileUpload__DraftItem').length).toBe(1);
  });

  it('shows a validation error when more than five files are selected', () => {
    const fixture = createComponent(createField('resume', 'Resume'), new FormGroup({ resume: new FormControl([]) }));
    const input = openModal(fixture);

    selectFiles(
      input,
      createFile('1.txt', 100),
      createFile('2.txt', 100),
      createFile('3.txt', 100),
      createFile('4.txt', 100),
      createFile('5.txt', 100),
      createFile('6.txt', 100)
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('You can upload up to 5 files.');
    expect((fixture.componentInstance.formGroup.get('resume')?.value as unknown[]).length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.formFileUpload__DraftItem').length).toBe(0);
  });

  it('shows a validation error when a selected file exceeds 5MB', () => {
    const fixture = createComponent(createField('resume', 'Resume'), new FormGroup({ resume: new FormControl([]) }));
    const input = openModal(fixture);

    selectFiles(input, createFile('too-large.mov', 5 * 1024 * 1024 + 1));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('too-large.mov exceeds the 5MB limit.');
    expect((fixture.componentInstance.formGroup.get('resume')?.value as unknown[]).length).toBe(0);
  });

  it('disables the choose-files control when the upload reaches the max file count', () => {
    const fixture = createComponent(createField('resume', 'Resume'), new FormGroup({ resume: new FormControl([]) }));
    const input = openModal(fixture);

    selectFiles(
      input,
      createFile('1.txt', 100),
      createFile('2.txt', 100),
      createFile('3.txt', 100),
      createFile('4.txt', 100),
      createFile('5.txt', 100)
    );
    fixture.detectChanges();

    const updatedInput = fixture.nativeElement.querySelector('.formFileUpload__Input') as HTMLInputElement;
    expect(updatedInput.disabled).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Maximum 5 files selected. Remove a file to add another.');
  });

  it('repopulates existing uploaded files from the control value and opens them in a new tab', () => {
    const formGroup = new FormGroup({
      resume: new FormControl([
        {
          Name: 'existing-contract.pdf',
          DownloadUrl: '/globalassets/forms-upload-assets/existing-contract.pdf',
          AssetGuid: 'asset-123'
        }
      ] as unknown as never)
    });
    const fixture = createComponent(createField('resume', 'Resume'), formGroup);

    expect(fixture.nativeElement.textContent).toContain('existing-contract.pdf');

    const openSpy = spyOn(window, 'open');
    click(fixture, '.formFileUpload__View');

    expect(openSpy).toHaveBeenCalledOnceWith(
      'http://localhost:8000/api/globalassets/forms-upload-assets/existing-contract.pdf',
      '_blank',
      'noopener,noreferrer'
    );

    openModal(fixture);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('existing-contract.pdf');
  });

  it('uses field properties for single-file mode, size limit and accepted file types', () => {
    const fixture = createComponent(
      {
        ...createField('resume', 'Resume'),
        properties: {
          ...createField('resume', 'Resume').properties,
          allowMultiple: false,
          fileSize: 3,
          fileTypes: '.pdf,.png'
        }
      } as FormField,
      new FormGroup({ resume: new FormControl([]) })
    );

    const input = openModal(fixture);
    expect(input.multiple).toBeFalse();
    expect(input.accept).toBe('.pdf,.png');

    selectFiles(input, createFile('1.pdf', 100), createFile('2.pdf', 100));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('You can upload 1 file only.');

    selectFiles(input, createFile('too-large.pdf', 3 * 1024 * 1024 + 1));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('too-large.pdf exceeds the 3MB limit.');

    selectFiles(input, createFile('fresh.pdf', 100));
    fixture.detectChanges();
    click(fixture, '.formFileUpload__PrimaryAction');
    fixture.detectChanges();

    expect(fixture.componentInstance.formGroup.get('resume')?.value).toEqual([
      {
        name: 'fresh.pdf',
        size: 100,
        url: '',
        assetGuid: '',
        file: jasmine.any(File)
      }
    ]);
  });
});

function createComponent(field: FormField, formGroup: FormGroup): ComponentFixture<FileUploadFieldComponent> {
  const fixture = TestBed.createComponent(FileUploadFieldComponent);
  fixture.componentInstance.field = field;
  fixture.componentInstance.formGroup = formGroup;
  fixture.componentInstance.apiBaseURLPrefix = 'http://localhost:8000/api/';
  fixture.detectChanges();
  return fixture;
}

function openModal(fixture: ComponentFixture<FileUploadFieldComponent>): HTMLInputElement {
  click(fixture, '.formFileUpload__Trigger');
  fixture.detectChanges();
  return fixture.nativeElement.querySelector('.formFileUpload__Input') as HTMLInputElement;
}

function click(fixture: ComponentFixture<FileUploadFieldComponent>, selector: string): void {
  const button = fixture.nativeElement.querySelector(selector) as HTMLButtonElement;
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
