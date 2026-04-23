import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-form-step-navigation',
  standalone: true,
  templateUrl: './form-step-navigation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormStepNavigationComponent {
  readonly currentStepIndex = input.required<number>();
  readonly stepCount = input.required<number>();
  readonly showNavigation = input(true);
  readonly isFormFinalized = input(false);
  readonly isMalFormSteps = input(false);
  readonly isStepValidToDisplay = input(true);
  readonly previousButtonLabel = input('Previous');
  readonly nextButtonLabel = input('Next');
  readonly progressLabel = input('Page');

  readonly previous = output<void>();
  readonly next = output<void>();

  protected readonly currentDisplayStepIndex = computed(() => this.currentStepIndex() + 1);
  protected readonly canGoPrevious = computed(() => this.currentStepIndex() > 0);
  protected readonly canGoNext = computed(() => this.currentStepIndex() < this.stepCount() - 1);
  protected readonly progressWidth = computed(() => (100 * this.currentDisplayStepIndex()) / this.stepCount());
  protected readonly shouldShowNavigation = computed(
    () =>
      this.showNavigation() &&
      this.stepCount() > 1 &&
      this.currentStepIndex() > -1 &&
      this.currentStepIndex() < this.stepCount() &&
      !this.isFormFinalized() &&
      !this.isMalFormSteps() &&
      this.isStepValidToDisplay()
  );
}
