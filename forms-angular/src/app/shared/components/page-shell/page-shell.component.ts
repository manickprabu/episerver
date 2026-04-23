import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-shell',
  standalone: true,
  templateUrl: './page-shell.component.html',
  styleUrl: './page-shell.component.scss'
})
export class PageShellComponent {
  readonly eyebrow = input<string>('Placeholder');
  readonly title = input.required<string>();
  readonly description = input<string>('');
}
