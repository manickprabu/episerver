import '@angular/compiler';
import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';

import { ElementWrapperComponent } from './element-wrapper.component';

describe('ElementWrapperComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ElementWrapperComponent]
    }).compileComponents();
  });

  it('applies validation fail classes after submission', () => {
    const fixture = TestBed.createComponent(ElementWrapperComponent);
    fixture.componentInstance.className = 'formTextbox';
    fixture.componentInstance.control = new FormControl('', { nonNullable: true, validators: [Validators.required] });
    fixture.componentInstance.submitted = true;
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.form__Element') as HTMLDivElement;
    expect(wrapper.className).toContain('formTextbox');
    expect(wrapper.className).toContain('validationFail');
  });

  it('does not render wrapper markup when not visible', () => {
    const fixture = TestBed.createComponent(ElementWrapperComponent);
    fixture.componentInstance.isVisible = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.form__Element')).toBeNull();
  });
});
