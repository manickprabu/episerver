import { TestBed } from '@angular/core/testing';
import { EpiserverFormsModule } from '../../../episerver-forms.module';
import { FormStepNavigationComponent } from './form-step-navigation.component';

describe('FormStepNavigationComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EpiserverFormsModule]
    }).compileComponents();
  });

  it('renders localized labels and progress state', () => {
    const fixture = TestBed.createComponent(FormStepNavigationComponent);
    fixture.componentRef.setInput('currentStepIndex', 1);
    fixture.componentRef.setInput('stepCount', 3);
    fixture.componentRef.setInput('previousButtonLabel', 'Back');
    fixture.componentRef.setInput('nextButtonLabel', 'Continue');
    fixture.componentRef.setInput('progressLabel', 'Step');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Back');
    expect(host.textContent).toContain('Continue');
    expect(host.textContent).toContain('Step');
    expect(host.querySelector('.Form__NavigationBar__ProgressBar--Progress')?.getAttribute('style')).toContain('66.666');
  });

  it('hides navigation when the form is finalized', () => {
    const fixture = TestBed.createComponent(FormStepNavigationComponent);
    fixture.componentRef.setInput('currentStepIndex', 0);
    fixture.componentRef.setInput('stepCount', 2);
    fixture.componentRef.setInput('isFormFinalized', true);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.Form__NavigationBar')).toBeNull();
  });
});
