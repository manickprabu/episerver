import { ChangeDetectionStrategy, Component, DestroyRef, Signal, computed, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IdentityInfo } from '../../services/form-auth.service';
import { FormLoginStateService } from '../../services/form-login-state.service';

@Component({
  selector: 'lib-form-login',
  standalone: false,
  templateUrl: './form-login.component.html',
  styleUrl: './form-login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FormLoginStateService]
})
export class FormLoginComponent {
  readonly clientId = input.required<string>();
  readonly authBaseUrl = input.required<string>();
  readonly onAuthenticated = output<IdentityInfo>();

  protected readonly loginForm: FormGroup;
  protected readonly canSubmit: Signal<boolean>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef,
    protected readonly loginState: FormLoginStateService
  ) {
    this.loginForm = this.formBuilder.nonNullable.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.canSubmit = computed(
      () => this.loginForm.valid && !this.loginState.isSubmitting() && !!this.authBaseUrl().trim()
    );
    this.loginState.watchAccessToken(this.destroyRef);
  }

  protected submit(): void {
    if (this.loginForm.invalid || this.loginState.isSubmitting()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.loginForm.getRawValue();
    this.loginState.login(username, password, this.clientId(), this.authBaseUrl()).subscribe({
      next: (identityInfo) => {
        this.onAuthenticated.emit(identityInfo);
      }
    });
  }
}
