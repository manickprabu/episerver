import '@angular/compiler';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { FormField } from '../../../models/form-schema.model';
import { EpiserverFormComponent } from './episerver-form.component';

describe('EpiserverFormComponent', () => {
  let fixture: ComponentFixture<EpiserverFormComponent>;
  let component: EpiserverFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EpiserverFormComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(EpiserverFormComponent);
    component = fixture.componentInstance;
    component.formGroup = new FormGroup({});
    component.submitted = true;
  });

  it('renders DateTimeElementBlock with the date field component', () => {
    component.field = {
      key: 'date-key',
      contentType: 'DateTimeElementBlock',
      displayName: 'Date',
      localizations: {},
      locale: 'en',
      properties: { label: 'Date' }
    } as unknown as FormField;

    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('lib-date-time-field'))).not.toBeNull();
    expect(fixture.debugElement.query(By.css('lib-text-field'))).toBeNull();
  });

  it('falls back to the default message for unsupported content types', () => {
    component.field = {
      key: 'unknown-key',
      contentType: 'UnknownElementBlock',
      displayName: 'Unknown',
      localizations: {},
      locale: 'en',
      properties: { label: 'Unknown' }
    } as unknown as FormField;

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cannot render UnknownElementBlock.');
  });
});
