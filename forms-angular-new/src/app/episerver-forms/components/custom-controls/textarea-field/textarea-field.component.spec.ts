import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TextareaFieldComponent } from './textarea-field.component';

describe('ControlTextareaFieldComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextareaFieldComponent]
    }).compileComponents();
  });

  it('renders and updates the textarea value through CVA methods', () => {
    const fixture = TestBed.createComponent(TextareaFieldComponent);
    fixture.componentInstance.placeholder = 'Tell us more';
    fixture.componentInstance.writeValue('initial text');
    fixture.detectChanges();

    const textarea = fixture.debugElement.query(By.css('textarea')).nativeElement as HTMLTextAreaElement;
    expect(textarea.value).toBe('initial text');

    fixture.componentInstance.writeValue('patched text');
    fixture.detectChanges();
    expect(textarea.value).toBe('patched text');
  });

  it('propagates input and blur events to registered callbacks', () => {
    const fixture = TestBed.createComponent(TextareaFieldComponent);

    let changedValue = '';
    let touched = false;
    fixture.componentInstance.registerOnChange(value => {
      changedValue = value;
    });
    fixture.componentInstance.registerOnTouched(() => {
      touched = true;
    });
    fixture.detectChanges();

    const textarea = fixture.debugElement.query(By.css('textarea')).nativeElement as HTMLTextAreaElement;
    textarea.value = 'typed text';
    textarea.dispatchEvent(new Event('input'));
    textarea.dispatchEvent(new Event('blur'));

    expect(changedValue).toBe('typed text');
    expect(touched).toBe(true);
  });
});
