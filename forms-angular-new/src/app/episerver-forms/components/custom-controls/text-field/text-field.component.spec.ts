import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { TextFieldComponent } from './text-field.component';

describe('ControlTextFieldComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextFieldComponent]
    }).compileComponents();
  });

  it('renders and updates the input value through CVA methods', () => {
    const fixture = TestBed.createComponent(TextFieldComponent);
    fixture.componentInstance.placeholder = 'Type here';
    fixture.componentInstance.writeValue('hello');
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    expect(input.value).toBe('hello');

    fixture.componentInstance.writeValue('updated');
    fixture.detectChanges();
    expect(input.value).toBe('updated');
  });

  it('propagates input and blur events to registered callbacks', () => {
    const fixture = TestBed.createComponent(TextFieldComponent);

    let changedValue = '';
    let touched = false;
    fixture.componentInstance.registerOnChange(value => {
      changedValue = value;
    });
    fixture.componentInstance.registerOnTouched(() => {
      touched = true;
    });
    fixture.detectChanges();

    const input = fixture.debugElement.query(By.css('input')).nativeElement as HTMLInputElement;
    input.value = 'typed';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));

    expect(changedValue).toBe('typed');
    expect(touched).toBe(true);
  });
});
