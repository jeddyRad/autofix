import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCar, faWrench, faSpinner, faExclamationTriangle, faLocationArrow, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  faCar = faCar;
  faWrench = faWrench;
  faSpinner = faSpinner;
  faExclamationTriangle = faExclamationTriangle;
  faLocationArrow = faLocationArrow;
  faCheckCircle = faCheckCircle;

  role: 'CLIENT' | 'PROVIDER' = 'CLIENT';
  first_name = '';
  last_name = '';
  email = '';
  password = '';
  phone = '';
  city = '';

  // Provider profile fields
  business_name = '';
  address = '';
  specialty = 'MECANICIEN';
  experience_years = 0;
  price_rate = 0;
  bio = '';
  latitude: number | null = null;
  longitude: number | null = null;

  // Geolocation state
  isGeoLoading = false;
  geoSuccess = false;
  geoError = '';

  readonly cities = [
    'Antananarivo', 'Toamasina', 'Mahajanga', 'Fianarantsoa',
    'Toliara', 'Antsiranana', 'Antsirabe', 'Ambatondrazaka',
    'Morondava', 'Nosy Be'
  ];

  errorMessage = '';
  isLoading = false;
  showOtpForm = false;
  otpCode = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  onSubmit(): void {
    if (!this.email || !this.password || !this.first_name || !this.last_name) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires (Nom, Prénom, Email, Mot de passe).';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload: any = {
      role: this.role,
      first_name: this.first_name,
      last_name: this.last_name,
      email: this.email,
      password: this.password,
      phone: this.phone,
      city: this.city
    };

    if (this.role === 'PROVIDER') {
      payload.provider_profile = {
        business_name: this.business_name || `${this.first_name} ${this.last_name}`,
        address: this.address || this.city,
        specialty: this.specialty,
        experience_years: this.experience_years,
        price_rate: this.price_rate,
        bio: this.bio,
        latitude: this.latitude,
        longitude: this.longitude
      };
    }

    this.authService.register(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.showOtpForm = true;
      },
      error: (err) => {
        this.isLoading = false;
        if (err.error && err.error.email) {
          this.errorMessage = "Cet email est déjà enregistré.";
        } else {
          this.errorMessage = "Une erreur est survenue lors de l'inscription. Veuillez réessayer.";
        }
        console.error(err);
      }
    });
  }

  /** Use the browser Geolocation API to capture the provider's GPS coordinates. */
  async useMyLocation(): Promise<void> {
    this.isGeoLoading = true;
    this.geoError = '';
    this.geoSuccess = false;
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true })
      );
      this.latitude = parseFloat(position.coords.latitude.toFixed(6));
      this.longitude = parseFloat(position.coords.longitude.toFixed(6));
      this.geoSuccess = true;
    } catch (err: any) {
      this.geoError = err.code === 1
        ? 'Géolocalisation refusée. Activez-la dans votre navigateur.'
        : 'Impossible de récupérer votre position. Saisissez l\'adresse manuellement.';
    } finally {
      this.isGeoLoading = false;
    }
  }

  clearGeo(): void {
    this.latitude = null;
    this.longitude = null;
    this.geoSuccess = false;
    this.geoError = '';
  }

  verifyOtp(): void {
    if (!this.otpCode) return;
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyOtp({ email: this.email, otp: this.otpCode }).subscribe({
      next: () => {
        this.authService.login({ email: this.email, password: this.password }).subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.isLoading = false;
            this.router.navigate(['/login']);
          }
        });
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = "Code OTP invalide ou expiré.";
      }
    });
  }

  resendOtp(): void {
    if (!this.email) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.resendOtp({ email: this.email }).subscribe({
      next: () => {
        this.isLoading = false;
        this.errorMessage = 'Un nouveau code a été envoyé. Veuillez vérifier vos emails.';
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = "Impossible de renvoyer le code. Veuillez réessayer.";
      }
    });
  }
}
