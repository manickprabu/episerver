import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IdentityInfo } from '../../../../core/services/form-auth.service';
import { FormLoginComponent } from '../../../../shared/components/form-login/form-login.component';

@Component({
  selector: 'app-form-login-page',
  standalone: true,
  imports: [FormLoginComponent],
  templateUrl: './form-login-page.component.html',
  styleUrl: './form-login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormLoginPageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  protected readonly clientId = signal('');
  protected readonly authBaseUrl = signal('');
  protected readonly identityInfo = signal<IdentityInfo | null>(null);

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const routeDefaults = this.route.snapshot.data;

      this.clientId.set(params.get('clientId') ?? routeDefaults['clientId'] ?? '');
      this.authBaseUrl.set(params.get('authBaseUrl') ?? routeDefaults['authBaseUrl'] ?? '');
    });
  }

  protected handleAuthenticated(identityInfo: IdentityInfo): void {
    this.identityInfo.set(identityInfo);
  }
}
