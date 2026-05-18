import { ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface SelectFieldOption {
  label: string;
  value: string;
}

@Component({
  selector: 'lib-control-select-field',
  standalone: false,
  template: `
    <select class="sample-control" [value]="value" [disabled]="disabled" (change)="handleChange($event)" (blur)="handleBlur()">
      <option value="">Select an option</option>
      @for (option of options; track option.value) {
        <option [value]="option.value" [selected]="option.value === value">{{ option.label }}</option>
      }
    </select>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectFieldComponent),
      multi: true
    }
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectFieldComponent implements ControlValueAccessor {
  @Input() options: SelectFieldOption[] = [];

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

  protected value = '';
  protected disabled = false;

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value ?? '';
    this.changeDetectorRef.markForCheck();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.changeDetectorRef.markForCheck();
  }

  protected handleChange(event: Event): void {
    const nextValue = (event.target as HTMLSelectElement).value;
    this.value = nextValue;
    this.onChange(nextValue);
  }

  protected handleBlur(): void {
    this.onTouched();
  }
}
