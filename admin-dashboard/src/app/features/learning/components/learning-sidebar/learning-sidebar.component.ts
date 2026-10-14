import { Component, Input, Output, EventEmitter, inject } from '@angular/core';

import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-learning-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './learning-sidebar.component.html',
  styleUrl: './learning-sidebar.component.scss'
})
export class LearningSidebarComponent {
  themeService = inject(ThemeService);

  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();

  close() {
    this.closeSidebar.emit();
  }
}
