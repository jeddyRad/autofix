import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
    private apiUrl = `${API_BASE_URL}/api/availability`;

    constructor(private http: HttpClient) { }

    getMySlots(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/`);
    }

    getProviderSlots(providerId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/?provider=${providerId}`);
    }

    addSlot(data: { weekday: number; start_time: string; end_time: string }): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/`, data);
    }

    deleteSlot(id: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}/`);
    }
}
