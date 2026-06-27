import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faLock, faToolbox, faSpinner, faLocationArrow, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  faUser = faUser;
  faLock = faLock;
  faToolbox = faToolbox;
  faSpinner = faSpinner;
  faLocationArrow = faLocationArrow;
  faCheckCircle = faCheckCircle;
  faExclamationTriangle = faExclamationTriangle;

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
      bio: '',
      latitude: null,
      longitude: null
    }
  };

  // Geolocation state
  isGeoLoading = false;
  geoSuccess = false;
  geoError = '';

  readonly cities = [
    'Antananarivo', 'Toamasina', 'Mahajanga', 'Fianarantsoa',
    'Toliara', 'Antsiranana', 'Antsirabe', 'Ambatondrazaka',
    'Morondava', 'Nosy Be'
  ];

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
          bio: '',
          latitude: null,
          longitude: null
        };
        this.profileData = { ...data, provider_profile: providerProfile };
        // Reflect existing geo state
        if (providerProfile.latitude && providerProfile.longitude) {
          this.geoSuccess = true;
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement du profil.';
        this.isLoading = false;
        console.error(err);
      }
    });
  }

  async useMyLocation(): Promise<void> {
    this.isGeoLoading = true;
    this.geoError = '';
    this.geoSuccess = false;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
      );
      this.profileData.provider_profile.latitude = parseFloat(position.coords.latitude.toFixed(6));
      this.profileData.provider_profile.longitude = parseFloat(position.coords.longitude.toFixed(6));
      this.geoSuccess = true;
    } catch (err: any) {
      this.geoError = err.code === 1
        ? 'Géolocalisation refusée. Activez-la dans votre navigateur.'
        : 'Impossible de récupérer votre position.';
    } finally {
      this.isGeoLoading = false;
    }
  }

  clearGeo(): void {
    this.profileData.provider_profile.latitude = null;
    this.profileData.provider_profile.longitude = null;
    this.geoSuccess = false;
    this.geoError = '';
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
          bio: '',
          latitude: null,
          longitude: null
        };
        this.profileData = { ...data, provider_profile: providerProfile };
        if (providerProfile.latitude && providerProfile.longitude) {
          this.geoSuccess = true;
        }
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
