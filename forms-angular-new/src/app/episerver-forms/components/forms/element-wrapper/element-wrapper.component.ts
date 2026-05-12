import { AbstractControl } from '@angular/forms';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'lib-element-wrapper',
  standalone: false,
  templateUrl: './element-wrapper.component.html',
  styleUrl: './element-wrapper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ElementWrapperComponent {
  readonly className = input('');
  readonly isVisible = input(true);
  readonly control = input<AbstractControl | null>(null);
  readonly submitted = input(false);

  protected readonly wrapperClass = computed(() => {
    const control = this.control();
    const isFail = !!control && control.invalid && (control.touched || this.submitted());
    const classes = ['form__Element'];

    if (this.className()) {
      classes.push(this.className());
    }

    classes.push(isFail ? 'validationFail form__Element--validationFail' : 'validationSuccess form__Element--validationSuccess');
    return classes.join(' ');
  });
}
