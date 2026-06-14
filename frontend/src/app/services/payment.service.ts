import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = 'http://localhost:8000/api/payments';

  constructor(private http: HttpClient) {}

  createCheckoutSession(appointmentId: number): Observable<{ checkout_url: string }> {
    return this.http.post<{ checkout_url: string }>(`${this.apiUrl}/create-session/`, { appointment_id: appointmentId });
  }

  verifyPayment(sessionId: string, appointmentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/verify/`, {
      params: { session_id: sessionId, appointment_id: appointmentId }
    });
  }
}
