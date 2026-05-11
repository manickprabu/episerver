import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'lib-accordion',
  standalone: false,
  templateUrl: './lib-accordion.component.html',
  styleUrls: ['./lib-accordion.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LibAccordionComponent {
  readonly accordionOpen = input<boolean | string>(false);
  readonly borderColor = input<string | null>(null);
  readonly icon = input<string | null>(null);
  readonly pillColor = input<string | null>(null);
  readonly pillText = input<string | null>(null);
  readonly title = input('');
  readonly loading = input(false);
  readonly disabled = input(false);

  readonly toggleAccordion = output<void>();

  protected readonly isOpen = computed(() => {
    const value = this.accordionOpen();
    return value === '' || value === true || value === 'true';
  });

  protected readonly hostBorderColor = computed(() => this.borderColor() || 'rgba(15, 23, 42, 0.14)');
  protected readonly resolvedPillColor = computed(() => this.pillColor() || '#475569');

  protected onToggle(): void {
    if (this.disabled()) {
      return;
    }

    this.toggleAccordion.emit();
  }
}
