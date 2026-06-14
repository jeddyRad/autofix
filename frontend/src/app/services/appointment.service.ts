import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient) {}

  getAppointments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/appointments/`);
  }

  createAppointment(appointmentData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/appointments/`, appointmentData);
  }

  acceptAppointment(id: number, price?: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/appointments/${id}/accept/`, { price });
  }

  cancelAppointment(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/appointments/${id}/cancel/`, {});
  }

  completeAppointment(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/appointments/${id}/complete/`, {});
  }

  submitReview(reviewData: { appointment: number; rating: number; comment: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reviews/`, reviewData);
  }
}
