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

  it('confirms selected files and keeps each upload question independent', async () => {
    const formGroup = new FormGroup({
      resume: new FormControl([]),
      portfolio: new FormControl([])
    });
    const resumeFixture = createComponent(createField('resume', 'Resume'), formGroup);
    const portfolioFixture = createComponent(createField('portfolio', 'Portfolio'), formGroup);

    const resumeInput = openModal(resumeFixture);
    selectFiles(resumeInput, createFile('resume.pdf', 1024), createFile('cover-letter.pdf', 2048));
    await resumeFixture.whenStable();
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
    selectFiles(portfolioInput, createFile('portfolio.pdf', 4096));
    await portfolioFixture.whenStable();
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

  it('shows a validation error when more than five files are selected', async () => {
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
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('You can upload up to 5 files.');
    expect((fixture.componentInstance.formGroup.get('resume')?.value as unknown[]).length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.formFileUpload__DraftItem').length).toBe(0);
  });

  it('shows a validation error when a selected file exceeds 20MB', async () => {
    const fixture = createComponent(createField('resume', 'Resume'), new FormGroup({ resume: new FormControl([]) }));
    const input = openModal(fixture);

    selectFiles(input, createFile('too-large.pdf', 20 * 1024 * 1024 + 1));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('The file size must be 20MB or less.');
    expect((fixture.componentInstance.formGroup.get('resume')?.value as unknown[]).length).toBe(0);
  });

  it('uses default accepted file types when the backend does not provide any', () => {
    const fixture = createComponent(createField('resume', 'Resume'), new FormGroup({ resume: new FormControl([]) }));
    const input = openModal(fixture);

    expect(input.accept).toBe('.pdf,.doc,.txt');
  });

  it('disables the choose-files control when the upload reaches the max file count', async () => {
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
    await fixture.whenStable();
    fixture.detectChanges();

    const updatedInput = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
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

  it('counts existing uploaded files against the max file limit inside the field-owned picker', () => {
    const formGroup = new FormGroup({
      resume: new FormControl([
        {
          Name: 'existing-contract.pdf',
          DownloadUrl: '/globalassets/forms-upload-assets/existing-contract.pdf',
          AssetGuid: 'asset-123'
        }
      ] as unknown as never)
    });
    const fixture = createComponent(
      {
        ...createField('resume', 'Resume'),
        properties: {
          ...createField('resume', 'Resume').properties,
          allowMultiple: false,
          fileTypes: '.pdf'
        }
      } as FormField,
      formGroup
    );

    openModal(fixture);
    fixture.detectChanges();

    expect(fixture.componentInstance['draftFiles']).toEqual([
      jasmine.objectContaining({
        name: 'existing-contract.pdf',
        size: undefined,
        url: '/globalassets/forms-upload-assets/existing-contract.pdf',
        assetGuid: 'asset-123'
      })
    ]);
    expect(fixture.nativeElement.textContent).toContain('Maximum 1 file selected. Remove it to add another.');
  });

  it('uses field properties for single-file mode, size limit and accepted file types', async () => {
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

    selectFiles(input, createFile('too-large.pdf', 3 * 1024 * 1024 + 1));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('The file size must be 3MB or less.');

    selectFiles(input, createFile('fresh.pdf', 100));
    await fixture.whenStable();
    fixture.detectChanges();
    click(fixture, '.formFileUpload__PrimaryAction');
    fixture.detectChanges();

    expect(fixture.componentInstance.formGroup.get('resume')?.value).toEqual([
      {
        name: 'fresh.pdf',
        size: 100,
        url: undefined,
        assetGuid: undefined,
        file: jasmine.any(File)
      }
    ]);
  });

  it('normalizes extension-only file types and rejects unsupported files after selection', async () => {
    const fixture = createComponent(
      {
        ...createField('resume', 'Resume'),
        properties: {
          ...createField('resume', 'Resume').properties,
          fileTypes: 'pdf,doc,txt'
        }
      } as FormField,
      new FormGroup({ resume: new FormControl([]) })
    );

    const input = openModal(fixture);
    expect(input.accept).toBe('.pdf,.doc,.txt');

    selectFiles(input, createFile('malware.exe', 100));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('The selected file type is not allowed.');
    expect((fixture.componentInstance.formGroup.get('resume')?.value as unknown[]).length).toBe(0);

    selectFiles(input, createFile('notes.txt', 100));
    await fixture.whenStable();
    fixture.detectChanges();
    click(fixture, '.formFileUpload__PrimaryAction');
    fixture.detectChanges();

    expect((fixture.componentInstance.formGroup.get('resume')?.value as Array<{ name: string }>)[0].name).toBe('notes.txt');
  });

  it('rejects a renamed executable even when its extension matches an allowed file type', async () => {
    const fixture = createComponent(
      {
        ...createField('resume', 'Resume'),
        properties: {
          ...createField('resume', 'Resume').properties,
          fileTypes: '.txt'
        }
      } as FormField,
      new FormGroup({ resume: new FormControl([]) })
    );

    const input = openModal(fixture);
    selectFiles(input, createFileWithBytes('safe-looking.txt', [0x4d, 0x5a, 0x90, 0x00]));
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve, 0));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('The selected file content is not allowed.');
    expect((fixture.componentInstance.formGroup.get('resume')?.value as unknown[]).length).toBe(0);
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
  return fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
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
  return new File([new Uint8Array(sizeInBytes)], name, { type: mimeTypeFor(name) });
}

function createFileWithBytes(name: string, bytes: number[]): File {
  const file = new File([new Uint8Array(bytes)], name, { type: mimeTypeFor(name) });
  const originalSlice = file.slice.bind(file);

  Object.defineProperty(file, 'slice', {
    configurable: true,
    value: (start?: number, end?: number, contentType?: string) => {
      const blob = originalSlice(start, end, contentType);
      const normalizedStart = start ?? 0;
      const normalizedEnd = end ?? bytes.length;
      const sliceBytes = bytes.slice(normalizedStart, normalizedEnd);

      Object.defineProperty(blob, 'arrayBuffer', {
        configurable: true,
        value: async () => new Uint8Array(sliceBytes).buffer
      });

      return blob;
    }
  });

  return file;
}

function mimeTypeFor(name: string): string {
  const extension = name.split('.').pop()?.toLowerCase() ?? '';

  switch (extension) {
    case 'pdf':
      return 'application/pdf';
    case 'doc':
      return 'application/msword';
    case 'txt':
      return 'text/plain';
    case 'png':
      return 'image/png';
    default:
      return 'application/octet-stream';
  }
}
