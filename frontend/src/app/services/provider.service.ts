import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private apiUrl = `${API_BASE_URL}/api/auth/providers`;

  constructor(private http: HttpClient) { }

  getProviders(filters?: {
    city?: string;
    specialty?: string;
    search?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  }): Observable<any[]> {
    let params = new HttpParams();
    if (filters) {
      if (filters.city) params = params.set('city', filters.city);
      if (filters.specialty) params = params.set('specialty', filters.specialty);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.lat != null) params = params.set('lat', filters.lat.toString());
      if (filters.lng != null) params = params.set('lng', filters.lng.toString());
      if (filters.radius != null) params = params.set('radius', filters.radius.toString());
    }
    return this.http.get<any[]>(`${this.apiUrl}/`, { params });
  }

  getProviderById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/`);
  }

  /** Wraps the browser Geolocation API in a Promise. */
  getUserPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La géolocalisation n\'est pas supportée par ce navigateur.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    });
  }
}

