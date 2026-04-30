import '@angular/compiler';
import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { EpiserverFormsModule } from '../../../episerver-forms.module';
import { FormField } from '../../../models/form-schema.model';
import { ElementCaptionComponent } from './element-caption.component';

describe('ElementCaptionComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpiserverFormsModule]
    }).compileComponents();
  });

  it('renders a label caption by default', () => {
    const fixture = TestBed.createComponent(ElementCaptionComponent);
    fixture.componentRef.setInput('field', {
      key: 'email',
      properties: { label: 'Email address', description: '' }
    } as FormField);
    fixture.detectChanges();

    const element = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    expect(element?.textContent).toContain('Email address');
    expect(element?.getAttribute('for')).toBe('email');
  });

  it('renders a legend when requested', () => {
    const fixture = TestBed.createComponent(ElementCaptionComponent);
    fixture.componentRef.setInput('field', {
      key: 'choice',
      properties: { label: 'Pick one', description: '' }
    } as FormField);
    fixture.componentRef.setInput('variant', 'legend');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('legend')?.textContent).toContain('Pick one');
  });
});
