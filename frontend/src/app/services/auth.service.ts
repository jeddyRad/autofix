// OBJECTIVE: Handle user authentication by communicating with the Django backend.
// HOW IT WORKS: This service makes HTTP requests to the Django backend endpoints.
// It stores the JWT (JSON Web Token) in localStorage so that subsequent requests can be authenticated.

import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Base URL pointing to the Django backend's authentication endpoints
  private apiUrl = `${API_BASE_URL}/api/auth`;

  // Using Angular signals for reactive state to hold current user information
  currentUser = signal<any>(null);

  constructor(private http: HttpClient) {
    // Restore user session if token exists
    if (this.isLoggedIn()) {
      const email = localStorage.getItem('user_email');
      const role = localStorage.getItem('user_role');
      const first_name = localStorage.getItem('user_first_name');
      const last_name = localStorage.getItem('user_last_name');
      const id = localStorage.getItem('user_id');
      if (email && role) {
        this.currentUser.set({ id, email, role, first_name, last_name });
      }
      // Also sync profile details in background
      this.getProfile().subscribe({
        next: (profile) => this.currentUser.set(profile),
        error: () => this.logout()
      });
    }
  }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register/`, userData);
  }

  verifyOtp(data: { email: string, otp: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-otp/`, data);
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password/`, { email });
  }

  resetPassword(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password/`, data);
  }

  login(credentials: any): Observable<any> {
    // Sends a POST request to Django's '/api/auth/login/' endpoint.
    return this.http.post<any>(`${this.apiUrl}/login/`, credentials).pipe(
      tap(response => {
        // The Django backend responds with JWT tokens (access & refresh).
        // These are saved in localStorage so the Interceptor can attach them to future requests.
        localStorage.setItem('token', response.access);
        localStorage.setItem('refresh', response.refresh);
        localStorage.setItem('user_id', response.id);
        localStorage.setItem('user_email', response.email);
        localStorage.setItem('user_role', response.role);
        localStorage.setItem('user_first_name', response.first_name);
        localStorage.setItem('user_last_name', response.last_name);

        this.currentUser.set({
          id: response.id,
          email: response.email,
          role: response.role,
          first_name: response.first_name,
          last_name: response.last_name
        });
      })
    );
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/me/`).pipe(
      tap(profile => this.currentUser.set(profile))
    );
  }

  updateProfile(profileData: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/me/`, profileData).pipe(
      tap(profile => this.currentUser.set(profile))
    );
  }

  logout(): void {
    localStorage.clear();
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUserRole(): string | null {
    return localStorage.getItem('user_role');
  }
}
