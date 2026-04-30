import { Injectable } from '@angular/core';
import { from, Observable, tap } from 'rxjs';

import {
  FormAuthenticateService as SdkFormAuthenticateService,
  FormCacheService,
  FormConstants,
  IdentityInfo
} from '../../episerver-forms/sdk';

@Injectable()
export class FormAuthService {
  constructor(
    private readonly sdkFormAuthenticateService: SdkFormAuthenticateService,
    private readonly formCacheService: FormCacheService
  ) {}

  login(username: string, password: string, clientId: string, authBaseUrl: string): Observable<IdentityInfo> {
    return from(
      this.sdkFormAuthenticateService
        .login(
          {
            clientId,
            grantType: 'password',
            authBaseUrl
          },
          username,
          password
        )
        .then((accessToken) => ({ username, accessToken }))
    ).pipe(tap((identityInfo) => this.formCacheService.set<string>(FormConstants.FormAccessToken, identityInfo.accessToken)));
  }

  getAccessToken(): string {
    return this.formCacheService.get<string>(FormConstants.FormAccessToken) ?? '';
  }

  clearAccessToken(): void {
    this.formCacheService.remove(FormConstants.FormAccessToken);
  }
}
