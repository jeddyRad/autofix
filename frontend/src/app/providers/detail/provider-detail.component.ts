import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProviderService } from '../../services/provider.service';
import { AppointmentService } from '../../services/appointment.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faUser, faMapMarkerAlt, faMoneyBill, faStar, faCar, faWrench, faCommentDots, faPhone, faBriefcase, faCalendarAlt, faClock, faTools, faCheckCircle, faExclamationTriangle, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { AvailabilityService } from '../../services/availability.service';

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
  faMoneyBill = faMoneyBill;
  faStar = faStar;
  faCar = faCar;
  faWrench = faWrench;
  faCommentDots = faCommentDots;
  faPhone = faPhone;
  faBriefcase = faBriefcase;
  faCalendarAlt = faCalendarAlt;
  faClock = faClock;
  faTools = faTools;
  faCheckCircle = faCheckCircle;
  faExclamationTriangle = faExclamationTriangle;
  faSpinner = faSpinner;
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

  timeSlots: string[] = [];
  availableSlots: any[] = [];

  route = inject(ActivatedRoute);
  router = inject(Router);
  providerService = inject(ProviderService);
  appointmentService = inject(AppointmentService);
  authService = inject(AuthService);
  chatService = inject(ChatService);
  availabilityService = inject(AvailabilityService);

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
        this.loadAvailability(id);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  loadAvailability(id: string): void {
    this.availabilityService.getProviderSlots(id).subscribe({
      next: (slots) => {
        this.availableSlots = slots;
      },
      error: (err) => console.error('Error loading slots:', err)
    });
  }

  onDateChange(): void {
    if (!this.date) {
      this.timeSlots = [];
      return;
    }
    const selectedDate = new Date(this.date);
    // JS Date.getDay() returns 0 for Sunday, 1 for Monday, etc.
    // Our API might use a different mapping, let's assume 0=Monday (Django style) or 0=Sunday.
    // Often 0=Monday, 6=Sunday.
    // Let's check getDay() result: 0 is Sunday, 1 is Monday...
    // If our backend uses 0=Monday, then we need (selectedDate.getDay() + 6) % 7
    // Let's assume 0=Monday for now as it's common in specialized apps.
    const day = (selectedDate.getDay() + 6) % 7; 
    
    this.timeSlots = this.availableSlots
      .filter(s => s.weekday === day)
      .map(s => `${s.start_time.substring(0, 5)} - ${s.end_time.substring(0, 5)}`);
    
    if (this.timeSlots.length > 0) {
      this.timeSlot = this.timeSlots[0];
    } else {
      this.timeSlot = '';
    }
  }

  getStars(rating: number = 0): number[] {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.round(rating)) stars.push(1); // Full star
        else stars.push(0); // Empty star
    }
    return stars;
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
