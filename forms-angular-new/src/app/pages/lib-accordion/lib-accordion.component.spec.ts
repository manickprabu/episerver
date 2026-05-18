import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LibAccordionComponent } from './lib-accordion.component';

describe('LibAccordionComponent', () => {
  let fixture: ComponentFixture<LibAccordionComponent>;
  let component: LibAccordionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LibAccordionComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LibAccordionComponent);
    component = fixture.componentInstance;
  });

  it('resolves open state and fallback colors', () => {
    fixture.componentRef.setInput('accordionOpen', 'true');
    fixture.componentRef.setInput('borderColor', null);
    fixture.componentRef.setInput('pillColor', null);
    fixture.detectChanges();

    expect((component as any).isOpen()).toBeTrue();
    expect((component as any).hostBorderColor()).toContain('rgba');
    expect((component as any).resolvedPillColor()).toBe('#475569');
  });

  it('emits toggle when enabled and blocks it when disabled', () => {
    const emitSpy = spyOn(component.toggleAccordion, 'emit');

    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    (component as any).onToggle();
    expect(emitSpy).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    (component as any).onToggle();
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });
});
