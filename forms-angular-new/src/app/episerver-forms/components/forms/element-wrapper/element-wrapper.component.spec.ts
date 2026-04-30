import '@angular/compiler';
import { beforeEach, describe, expect, it } from 'vitest';
import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { TestBed } from '@angular/core/testing';
import { EpiserverFormsModule } from '../../../episerver-forms.module';

@Component({
  selector: 'lib-element-wrapper-host',
  standalone: false,
  template: `
    <lib-element-wrapper [className]="'FormTextbox'" [control]="control" [submitted]="submitted" [isVisible]="isVisible">
      <span class="InnerContent">Child</span>
    </lib-element-wrapper>
  `
})
class ElementWrapperHostComponent {
  readonly control = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  submitted = false;
  isVisible = true;
}

describe('ElementWrapperComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpiserverFormsModule],
      declarations: [ElementWrapperHostComponent]
    }).compileComponents();
  });

  it('applies validation fail classes after submission', () => {
    const fixture = TestBed.createComponent(ElementWrapperHostComponent);
    fixture.componentInstance.submitted = true;
    fixture.detectChanges();

    const wrapper = fixture.nativeElement.querySelector('.Form__Element') as HTMLDivElement;
    expect(wrapper.className).toContain('FormTextbox');
    expect(wrapper.className).toContain('ValidationFail');
  });

  it('hides projected content when not visible', () => {
    const fixture = TestBed.createComponent(ElementWrapperHostComponent);
    fixture.componentInstance.isVisible = false;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.InnerContent')).toBeNull();
  });
});
