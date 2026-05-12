import { firstValueFrom } from 'rxjs';
import { skip, take } from 'rxjs/operators';
import { FormControl, FormGroup } from '@angular/forms';

import { EpiserverFormAccordionVisibilityService } from './episerver-form-accordion-visibility.service';
import { EpiserverFieldDefinition } from '../../episerver-forms/models/episerver-form-definition.model';

describe('EpiserverFormAccordionVisibilityService', () => {
  const fields: EpiserverFieldDefinition[] = [
    {
      name: 'Source field',
      contentLink: { id: 31796 },
      contentGuid: 'source-31796',
      type: 'SelectionElementBlockProxy',
      properties: { Label: 'Source field' }
    },
    {
      name: 'Dependent field',
      contentLink: { id: 31799 },
      contentGuid: 'dependent-31799',
      type: 'TextareaElementBlockProxy',
      properties: {
        Label: 'Dependent field',
        Conditions: [{ field: { id: 31796 }, fieldValue: 'Yes' }]
      }
    }
  ];

  it('reacts to form control value changes', async () => {
    const service = new EpiserverFormAccordionVisibilityService();
    const formGroup = new FormGroup({
      'source-31796': new FormControl('No'),
      'dependent-31799': new FormControl('')
    });

    const visibility$ = service.watchVisibility(fields, formGroup);
    const firstState = await firstValueFrom(visibility$);
    const nextStatePromise = firstValueFrom(visibility$.pipe(skip(1), take(1)));

    formGroup.get('source-31796')?.setValue('Yes');
    const nextState = await nextStatePromise;

    expect(firstState.visibilityByGuid['dependent-31799']).toBe(false);
    expect(nextState.visibilityByGuid['dependent-31799']).toBe(true);
  });
});
