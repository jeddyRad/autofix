import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: '../login/login.component.css'
})
export class ResetPasswordComponent implements OnInit {
  newPassword = '';
  confirmPassword = '';
  uid = '';
  token = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  route = inject(ActivatedRoute);
  router = inject(Router);
  authService = inject(AuthService);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.uid = params['uid'] || '';
      this.token = params['token'] || '';
      if (!this.uid || !this.token) {
        this.errorMessage = "Lien invalide. Copiez l'URL complète depuis le terminal.";
      }
    });
  }

  onSubmit(): void {
    if (!this.newPassword || !this.confirmPassword) return;
    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = "Les mots de passe ne correspondent pas.";
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    
    this.authService.resetPassword({
      uid: this.uid,
      token: this.token,
      new_password: this.newPassword
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = "Mot de passe réinitialisé avec succès.";
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || "Le lien est invalide ou a expiré.";
      }
    });
  }
}
