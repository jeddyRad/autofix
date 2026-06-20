import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome, faTools, faClipboardList, faUser, faCommentDots, faSignOutAlt, faSignInAlt } from '@fortawesome/free-solid-svg-icons';
import { ToastComponent } from './shared/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, FontAwesomeModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'frontend';
  authService = inject(AuthService);
  private router = inject(Router);

  faHome = faHome;
  faTools = faTools;
  faClipboardList = faClipboardList;
  faUser = faUser;
  faCommentDots = faCommentDots;
  faSignOutAlt = faSignOutAlt;
  faSignInAlt = faSignInAlt;

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
