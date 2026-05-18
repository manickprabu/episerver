import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'lib-form-step-navigation',
  standalone: false,
  templateUrl: './form-step-navigation.component.html',
  styleUrls: ['./form-step-navigation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormStepNavigationComponent {
  @Input() currentStepIndex!: number;
  @Input() stepCount!: number;
  @Input() showNavigation = true;
  @Input() isFormFinalized = false;
  @Input() isMalFormSteps = false;
  @Input() isStepValidToDisplay = true;
  @Input() previousButtonLabel = 'Previous';
  @Input() nextButtonLabel = 'Next';
  @Input() progressLabel = 'Page';

  @Output() readonly previous = new EventEmitter<void>();
  @Output() readonly next = new EventEmitter<void>();

  protected get currentDisplayStepIndex(): number {
    return this.currentStepIndex + 1;
  }

  protected get canGoPrevious(): boolean {
    return this.currentStepIndex > 0;
  }

  protected get canGoNext(): boolean {
    return this.currentStepIndex < this.stepCount - 1;
  }

  protected get progressWidth(): number {
    return this.stepCount > 0 ? (100 * this.currentDisplayStepIndex) / this.stepCount : 0;
  }

  protected get shouldShowNavigation(): boolean {
    return this.showNavigation && this.stepCount > 1 && this.currentStepIndex > -1 && this.currentStepIndex < this.stepCount && !this.isFormFinalized && !this.isMalFormSteps && this.isStepValidToDisplay;
  }
}
