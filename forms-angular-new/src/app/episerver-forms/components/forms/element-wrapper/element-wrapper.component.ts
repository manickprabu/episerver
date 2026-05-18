import { AbstractControl } from '@angular/forms';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'lib-element-wrapper',
  standalone: false,
  templateUrl: './element-wrapper.component.html',
  styleUrl: './element-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElementWrapperComponent {
  @Input() className = '';
  @Input() isVisible = true;
  @Input() control: AbstractControl | null = null;
  @Input() submitted = false;

  protected get wrapperClass(): string {
    const control = this.control;
    const isFail = !!control && control.invalid && (control.touched || this.submitted);
    const classes = ['form__Element'];

    if (this.className) {
      classes.push(this.className);
    }

    classes.push(isFail ? 'validationFail form__Element--validationFail' : 'validationSuccess form__Element--validationSuccess');
    return classes.join(' ');
  }
}
