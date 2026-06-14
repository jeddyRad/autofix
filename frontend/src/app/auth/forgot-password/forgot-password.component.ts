import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../login/login.component.css'
})
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  authService = inject(AuthService);

  onSubmit(): void {
    if (!this.email) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || "Un email a été envoyé si le compte existe.";
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = "Une erreur est survenue. Veuillez réessayer.";
      }
    });
  }
}
