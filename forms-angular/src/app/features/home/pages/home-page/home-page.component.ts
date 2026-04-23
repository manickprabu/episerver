import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageShellComponent } from '../../../../shared/components/page-shell/page-shell.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [RouterLink, PageShellComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent {}
