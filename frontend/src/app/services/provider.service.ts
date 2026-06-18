import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private apiUrl = `${API_BASE_URL}/api/auth/providers`;

  constructor(private http: HttpClient) {}

  getProviders(filters?: { city?: string; specialty?: string; search?: string }): Observable<any[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.city) params = params.set('city', filters.city);
      if (filters.specialty) params = params.set('specialty', filters.specialty);
      if (filters.search) params = params.set('search', filters.search);
    }
    return this.http.get<any[]>(`${this.apiUrl}/`, { params });
  }

  getProviderById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/`);
  }
}
