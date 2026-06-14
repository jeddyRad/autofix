import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  
  profileData: any = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    city: '',
    role: '',
    provider_profile: {
      business_name: '',
      address: '',
      specialty: '',
      experience_years: 0,
      price_rate: 0,
      bio: ''
    }
  };
  isLoading = true;
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (data) => {
        const providerProfile = data.provider_profile || {
          business_name: '',
          address: '',
          specialty: '',
          experience_years: 0,
          price_rate: 0,
          bio: ''
        };
        this.profileData = { ...data, provider_profile: providerProfile };
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement du profil.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  onSubmit(): void {
    this.isSaving = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    // Create a copy of the data to send
    const dataToSend = { ...this.profileData };
    
    // If not a provider, remove provider_profile to avoid validation errors
    if (dataToSend.role !== 'PROVIDER') {
      delete dataToSend.provider_profile;
    }
    
    this.authService.updateProfile(dataToSend).subscribe({
      next: (data) => {
        const providerProfile = data.provider_profile || {
          business_name: '',
          address: '',
          specialty: '',
          experience_years: 0,
          price_rate: 0,
          bio: ''
        };
        this.profileData = { ...data, provider_profile: providerProfile };
        this.successMessage = 'Profil mis à jour avec succès.';
        this.isSaving = false;
        
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la mise à jour du profil.';
        this.isSaving = false;
        console.error(err);
      }
    });
  }
}
