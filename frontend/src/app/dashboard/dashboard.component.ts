import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AppointmentService } from '../services/appointment.service';
import { PaymentService } from '../services/payment.service';
import { ToastService } from '../shared/toast.service';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../config/api.config';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faClipboardList, faCheckCircle, faTrophy, faTimesCircle, faCalendarAlt, faCreditCard, faStar, faWallet, faChartLine } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  faClipboardList = faClipboardList;
  faCheckCircle = faCheckCircle;
  faTrophy = faTrophy;
  faTimesCircle = faTimesCircle;
  faCalendarAlt = faCalendarAlt;
  faCreditCard = faCreditCard;
  faStar = faStar;
  faWallet = faWallet;
  faChartLine = faChartLine;

  authService = inject(AuthService);
  appointmentService = inject(AppointmentService);
  paymentService = inject(PaymentService);
  toastService = inject(ToastService);
  http = inject(HttpClient);

  appointments: any[] = [];
  providerStats: any = null;
  isLoading = true;
  activeTab = 'appointments';

  // Provider action modals
  priceInput = 0;
  actionAppointment: any = null;
  actionType = '';

  // Review form
  reviewAppointment: any = null;
  reviewRating = 5;
  reviewComment = '';

  // Edit form
  editAppointment: any = null;
  editData: any = {
    date: '',
    time_slot: '',
    vehicle_info: '',
    problem_description: ''
  };

  ngOnInit(): void {
    this.loadAppointments();
    if (this.role === 'PROVIDER') {
      this.loadProviderStats();
    }
  }

  loadProviderStats(): void {
    this.http.get(`${API_BASE_URL}/api/auth/provider/stats/`).subscribe({
      next: (stats) => this.providerStats = stats,
      error: (err) => console.error('Failed to load stats', err)
    });
  }

  loadAppointments(): void {
    this.isLoading = true;
    this.appointmentService.getAppointments().subscribe({
      next: (data) => {
        this.appointments = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  get role(): string {
    return this.authService.getUserRole() || 'CLIENT';
  }

  get user(): any {
    return this.authService.currentUser();
  }

  get pendingAppointments(): any[] {
    return this.appointments.filter(a => a.status === 'PENDING');
  }

  get activeAppointments(): any[] {
    return this.appointments.filter(a => a.status === 'ACCEPTED' || a.status === 'IN_PROGRESS');
  }

  get completedAppointments(): any[] {
    return this.appointments.filter(a => a.status === 'COMPLETED');
  }

  get cancelledAppointments(): any[] {
    return this.appointments.filter(a => a.status === 'CANCELLED');
  }

  // Provider Actions
  openAction(appointment: any, type: string): void {
    this.actionAppointment = appointment;
    this.actionType = type;
    if (type === 'accept') {
      this.priceInput = appointment.price || 0;
    }
  }

  closeAction(): void {
    this.actionAppointment = null;
    this.actionType = '';
  }

  acceptAppointment(): void {
    if (!this.actionAppointment) return;
    this.appointmentService.acceptAppointment(this.actionAppointment.id, this.priceInput).subscribe({
      next: () => {
        this.closeAction();
        this.loadAppointments();
        this.toastService.success('Rendez-vous accepté !');
      },
      error: (err) => {
        console.error(err);
        this.toastService.error('Erreur lors de l\'acceptation.');
      }
    });
  }

  cancelAppointment(id: number): void {
    this.appointmentService.cancelAppointment(id).subscribe({
      next: () => {
        this.loadAppointments();
        this.toastService.info('Rendez-vous annulé.');
      },
      error: (err) => console.error(err)
    });
  }

  startAppointment(id: number): void {
    this.appointmentService.startAppointment(id).subscribe({
      next: () => {
        this.loadAppointments();
        this.toastService.success('Intervention démarrée !');
      },
      error: (err) => console.error(err)
    });
  }

  completeAppointment(id: number): void {
    this.appointmentService.completeAppointment(id).subscribe({
      next: () => {
        this.loadAppointments();
        this.toastService.success('Intervention terminée avec succès !');
      },
      error: (err) => console.error(err)
    });
  }

  // Client Actions
  payAppointment(appointment: any): void {
    this.paymentService.createCheckoutSession(appointment.id).subscribe({
      next: (res) => {
        window.location.href = res.checkout_url;
      },
      error: (err) => {
        console.error(err);
        alert('Erreur lors de la création de la session de paiement.');
      }
    });
  }

  openReview(appointment: any): void {
    this.reviewAppointment = appointment;
    this.reviewRating = 5;
    this.reviewComment = '';
  }

  closeReview(): void {
    this.reviewAppointment = null;
  }

  openEdit(appointment: any): void {
    this.editAppointment = appointment;
    this.editData = {
      date: appointment.date,
      time_slot: appointment.time_slot,
      vehicle_info: appointment.vehicle_info,
      problem_description: appointment.problem_description
    };
  }

  closeEdit(): void {
    this.editAppointment = null;
  }

  submitEdit(): void {
    if (!this.editAppointment) return;
    this.appointmentService.updateAppointment(this.editAppointment.id, this.editData).subscribe({
      next: () => {
        this.closeEdit();
        this.loadAppointments();
        this.toastService.success('Mise à jour réussie.');
      },
      error: (err: any) => this.toastService.error('Erreur lors de la modification.')
    });
  }

  submitReview(): void {
    if (!this.reviewAppointment) return;
    this.appointmentService.submitReview({
      appointment: this.reviewAppointment.id,
      rating: this.reviewRating,
      comment: this.reviewComment
    }).subscribe({
      next: () => {
        this.closeReview();
        this.loadAppointments();
        this.toastService.success('Merci pour votre avis !');
      },
      error: (err) => console.error(err)
    });
  }

  getStatusLabel(status: string): string {
    const map: any = {
      'PENDING': 'En attente',
      'ACCEPTED': 'Accepté',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Terminé',
      'CANCELLED': 'Annulé'
    };
    return map[status] || status;
  }

  getPaymentLabel(status: string): string {
    return status === 'PAID' ? 'Payé' : 'Non payé';
  }
}
