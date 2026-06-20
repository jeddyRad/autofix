import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = `${API_BASE_URL}/api`;

  constructor(private http: HttpClient) { }

  getAppointments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/appointments/`);
  }

  createAppointment(appointmentData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/appointments/`, appointmentData);
  }

  updateAppointment(id: number, data: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/appointments/${id}/`, data);
  }

  acceptAppointment(id: number, price?: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/appointments/${id}/accept/`, { price });
  }

  cancelAppointment(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/appointments/${id}/cancel/`, {});
  }

  startAppointment(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/appointments/${id}/start/`, {});
  }

  completeAppointment(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/appointments/${id}/complete/`, {});
  }

  submitReview(reviewData: { appointment: number; rating: number; comment: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reviews/`, reviewData);
  }
}
