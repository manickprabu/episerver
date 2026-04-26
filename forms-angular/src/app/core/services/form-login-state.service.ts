import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, catchError, finalize, interval, map, tap } from 'rxjs';
import { FormAuthService, IdentityInfo } from './form-auth.service';

@Injectable()
export class FormLoginStateService {
  private readonly formAuthService = inject(FormAuthService);

  readonly isAuthenticated = signal(this.formAuthService.hasAccessToken());
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal('');

  watchAccessToken(destroyRef: DestroyRef): void {
    interval(1000)
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe(() => {
        if (!this.formAuthService.hasAccessToken()) {
          this.isAuthenticated.set(false);
        }
      });
  }

  login(username: string, password: string, clientId: string, authBaseUrl: string): Observable<IdentityInfo> {
    this.isSubmitting.set(true);
    this.errorMessage.set('');

    return this.formAuthService.login(username, password, clientId, authBaseUrl).pipe(
      map((accessToken) => ({ username, accessToken })),
      tap({
        next: (identityInfo) => {
          this.formAuthService.storeAccessToken(identityInfo.accessToken);
          this.isAuthenticated.set(true);
        }
      }),
      catchError(() => {
        this.errorMessage.set('Wrong credentials!');
        this.isAuthenticated.set(false);
        return EMPTY;
      }),
      finalize(() => {
        this.isSubmitting.set(false);
      })
    );
  }
}
