import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentService } from '../../services/payment.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterLink, FontAwesomeModule],
  templateUrl: './payment-success.component.html',
  styleUrl: './payment-success.component.css'
})
export class PaymentSuccessComponent implements OnInit {
  faCheckCircle = faCheckCircle;
  faExclamationTriangle = faExclamationTriangle;
  route = inject(ActivatedRoute);
  paymentService = inject(PaymentService);

  isLoading = true;
  isVerified = false;
  errorMessage = '';

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const sessionId = params['session_id'];
      const appointmentId = params['appointment_id'];

      if (sessionId && appointmentId) {
        this.paymentService.verifyPayment(sessionId, appointmentId).subscribe({
          next: (res) => {
            this.isLoading = false;
            this.isVerified = res.status === 'PAID';
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage = 'Erreur lors de la vérification du paiement.';
            console.error(err);
          }
        });
      } else {
        this.isLoading = false;
        this.isVerified = true;
      }
    });
  }
}
