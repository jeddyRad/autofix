import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome, faTools, faChartLine, faUser, faCommentDots, faSignOutAlt, faSignInAlt, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { ToastComponent } from './shared/toast.component';
import { ChatService } from './services/chat.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FontAwesomeModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {
  title = 'frontend';
  authService = inject(AuthService);
  private router = inject(Router);
  private chatService = inject(ChatService);

  faHome = faHome;
  faTools = faTools;
  faChartLine = faChartLine;
  faUser = faUser;
  faCommentDots = faCommentDots;
  faSignOutAlt = faSignOutAlt;
  faSignInAlt = faSignInAlt;
  faCalendarAlt = faCalendarAlt;

  showLogoutModal = false;
  unreadTotal = 0;

  constructor() {
    this.updateUnreadCount();
    
    // Listen for manual refresh requests
    this.chatService.unreadCount$.subscribe(() => {
      this.updateUnreadCount();
    });

    // Poll every 60 seconds as a fallback
    setInterval(() => this.updateUnreadCount(), 60000);
  }

  updateUnreadCount(): void {
    if (this.authService.isLoggedIn()) {
      this.chatService.getUnreadTotal().subscribe({
        next: (res: { unread_total: number }) => this.unreadTotal = res.unread_total,
        error: (err: any) => console.error('Error fetching unread count', err)
      });
    } else {
      this.unreadTotal = 0;
    }
  }

  logout(): void {
    this.showLogoutModal = true;
  }

  confirmLogout(): void {
    this.authService.logout();
    this.showLogoutModal = false;
    this.router.navigate(['/']);
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
  }
}
