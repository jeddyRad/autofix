import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProviderService } from '../../services/provider.service';
import { AppointmentService } from '../../services/appointment.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faMapMarkerAlt, faEuroSign, faStar, faCar, faWrench, faCommentDots, faPhone, faBriefcase } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './provider-detail.component.html',
  styleUrl: './provider-detail.component.css'
})
export class ProviderDetailComponent implements OnInit {
  faUser = faUser;
  faMapMarkerAlt = faMapMarkerAlt;
  faEuroSign = faEuroSign;
  faStar = faStar;
  faCar = faCar;
  faWrench = faWrench;
  faCommentDots = faCommentDots;
  faPhone = faPhone;
  faBriefcase = faBriefcase;
  provider: any = null;
  isLoading = true;
  
  // Booking form fields
  date = '';
  timeSlot = '08:00 - 10:00';
  vehicleInfo = '';
  problemDescription = '';
  
  isBookingLoading = false;
  bookingSuccess = false;
  bookingError = '';

  timeSlots = ['08:00 - 10:00', '10:00 - 12:00', '14:00 - 16:00', '16:00 - 18:00'];

  route = inject(ActivatedRoute);
  router = inject(Router);
  providerService = inject(ProviderService);
  appointmentService = inject(AppointmentService);
  authService = inject(AuthService);
  chatService = inject(ChatService);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProvider(id);
    }
  }

  loadProvider(id: string): void {
    this.isLoading = true;
    this.providerService.getProviderById(id).subscribe({
      next: (data) => {
        this.provider = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  onBook(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    
    if (!this.date || !this.vehicleInfo || !this.problemDescription) {
      this.bookingError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }

    this.isBookingLoading = true;
    this.bookingError = '';
    this.bookingSuccess = false;

    const bookingData = {
      provider: this.provider.id,
      date: this.date,
      time_slot: this.timeSlot,
      vehicle_info: this.vehicleInfo,
      problem_description: this.problemDescription
    };

    this.appointmentService.createAppointment(bookingData).subscribe({
      next: () => {
        this.isBookingLoading = false;
        this.bookingSuccess = true;
        this.date = '';
        this.vehicleInfo = '';
        this.problemDescription = '';
        
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 2000);
      },
      error: (err) => {
        this.isBookingLoading = false;
        this.bookingError = 'Impossible de créer le rendez-vous. Veuillez réessayer.';
        console.error(err);
      }
    });
  }

  contactProvider(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.router.navigate(['/chat'], { queryParams: { partner: this.provider.id } });
  }
}
