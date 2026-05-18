import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { SelectFieldComponent } from './select-field.component';

describe('ControlSelectFieldComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectFieldComponent]
    }).compileComponents();
  });

  it('renders the initial value and reflects writeValue updates', () => {
    const fixture = TestBed.createComponent(SelectFieldComponent);
    fixture.componentInstance.options = [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' }
    ];
    fixture.componentInstance.writeValue('b');
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css('select')).nativeElement as HTMLSelectElement;
    expect((fixture.componentInstance as any).value).toBe('b');
    expect(select.options[select.selectedIndex]?.text).toBe('Option B');

    fixture.componentInstance.writeValue('a');
    fixture.detectChanges();

    expect((fixture.componentInstance as any).value).toBe('a');
    expect(select.options[select.selectedIndex]?.text).toBe('Option A');
  });

  it('emits changes and disabled state through the CVA contract', () => {
    const fixture = TestBed.createComponent(SelectFieldComponent);
    fixture.componentInstance.options = [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' }
    ];

    let changedValue = '';
    let touched = false;
    fixture.componentInstance.registerOnChange(value => {
      changedValue = value;
    });
    fixture.componentInstance.registerOnTouched(() => {
      touched = true;
    });
    fixture.componentInstance.setDisabledState(true);
    fixture.detectChanges();

    const select = fixture.debugElement.query(By.css('select')).nativeElement as HTMLSelectElement;
    expect(select.disabled).toBe(true);

    fixture.componentInstance.setDisabledState(false);
    fixture.detectChanges();
    select.value = 'a';
    select.dispatchEvent(new Event('change'));
    select.dispatchEvent(new Event('blur'));

    expect(changedValue).toBe('a');
    expect(touched).toBe(true);
  });
});
