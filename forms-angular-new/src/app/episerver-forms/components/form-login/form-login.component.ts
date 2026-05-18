import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IdentityInfo } from '../../episerver-sdk';
import { FormLoginStateService } from '../../services/form-login-state.service';

@Component({
  selector: 'lib-form-login',
  standalone: false,
  templateUrl: './form-login.component.html',
  styleUrls: ['./form-login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormLoginComponent {
  @Input() clientId!: string;
  @Input() authBaseUrl!: string;
  @Output() readonly onAuthenticated = new EventEmitter<IdentityInfo>();

  protected readonly loginForm: FormGroup;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly changeDetectorRef: ChangeDetectorRef,
    private readonly destroyRef: DestroyRef,
    protected readonly loginState: FormLoginStateService
  ) {
    this.loginForm = this.formBuilder.nonNullable.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    this.loginState.watchAccessToken(this.destroyRef);
    const subscription = this.loginState.stateChanges$.subscribe(() => {
      this.changeDetectorRef.markForCheck();
    });
    this.destroyRef.onDestroy(() => subscription.unsubscribe());
  }

  protected get canSubmit(): boolean {
    return this.loginForm.valid && !this.loginState.isSubmitting && !!this.authBaseUrl.trim();
  }

  protected submit(): void {
    if (this.loginForm.invalid || this.loginState.isSubmitting) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.loginForm.getRawValue();
    this.loginState.login(username, password, this.clientId, this.authBaseUrl).subscribe({
      next: identityInfo => {
        this.onAuthenticated.emit(identityInfo);
      }
    });
  }
}
