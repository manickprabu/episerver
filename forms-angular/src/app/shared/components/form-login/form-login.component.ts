import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IdentityInfo } from '../../../core/services/form-auth.service';
import { FormLoginStateService } from '../../../core/services/form-login-state.service';

@Component({
  selector: 'app-form-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './form-login.component.html',
  styleUrl: './form-login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [FormLoginStateService]
})
export class FormLoginComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly loginState = inject(FormLoginStateService);

  readonly clientId = input.required<string>();
  readonly authBaseUrl = input.required<string>();
  readonly onAuthenticated = output<IdentityInfo>();

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });
  protected readonly canSubmit = computed(
    () => this.loginForm.valid && !this.loginState.isSubmitting() && !!this.authBaseUrl().trim()
  );

  constructor() {
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
