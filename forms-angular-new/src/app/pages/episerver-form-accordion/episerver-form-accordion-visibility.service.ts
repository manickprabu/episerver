import { Injectable } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, shareReplay, startWith } from 'rxjs/operators';

import { EpiserverDynamicField, FieldVisibilityState } from './episerver-form-accordion.model';
import { evaluateFieldVisibility } from './episerver-form-accordion-visibility.util';

@Injectable({ providedIn: 'root' })
export class EpiserverFormAccordionVisibilityService {
  watchVisibility(fields: EpiserverDynamicField[], formGroup: FormGroup): Observable<FieldVisibilityState> {
    return formGroup.valueChanges.pipe(
      startWith(formGroup.getRawValue()),
      map((values) => evaluateFieldVisibility(fields, values as Record<string, unknown>)),
      distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  isFieldVisible(fieldContentGuid: string, state: FieldVisibilityState | null | undefined): boolean {
    if (!state) {
      return true;
    }

    return state.visibilityByGuid[fieldContentGuid] ?? true;
  }
}
