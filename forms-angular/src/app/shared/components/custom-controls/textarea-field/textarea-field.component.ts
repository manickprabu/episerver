import { ChangeDetectionStrategy, Component, forwardRef, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'textarea-field',
  standalone: true,
  template: `
    <textarea
      class="sample-control sample-control--textarea"
      [value]="value"
      [placeholder]="placeholder()"
      [disabled]="disabled"
      (input)="handleInput($event)"
      (blur)="handleBlur()"
    ></textarea>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextareaFieldComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextareaFieldComponent implements ControlValueAccessor {
  readonly placeholder = input('');

  protected value = '';
  protected disabled = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  protected handleInput(event: Event): void {
    const nextValue = (event.target as HTMLTextAreaElement).value;
    this.value = nextValue;
    this.onChange(nextValue);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
