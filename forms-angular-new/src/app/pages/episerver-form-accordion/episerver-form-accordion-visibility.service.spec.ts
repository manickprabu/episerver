import { EpiserverFormAccordionVisibilityService } from './episerver-form-accordion-visibility.service';

describe('EpiserverFormAccordionVisibilityService', () => {
  let service: EpiserverFormAccordionVisibilityService;

  beforeEach(() => {
    service = new EpiserverFormAccordionVisibilityService();
  });

  it('reports whether an accordion step is open', () => {
    expect(service.isStepOpen(1, 1)).toBe(true);
    expect(service.isStepOpen(1, 0)).toBe(false);
  });

  it('keeps accordion accessibility logic separate from field visibility logic', () => {
    expect(service.isStepAccessible(0)).toBe(true);
    expect(service.isStepAccessible(4)).toBe(true);
  });
});
