import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class HistoryService {
    private apiUrl = `${API_BASE_URL}/api/appointments`;

    constructor(private http: HttpClient) { }

    getHistory(filters: { status?: string; date_from?: string; date_to?: string } = {}): Observable<any[]> {
        let params = new HttpParams();
        if (filters.status) params = params.set('status', filters.status);
        if (filters.date_from) params = params.set('date_from', filters.date_from);
        if (filters.date_to) params = params.set('date_to', filters.date_to);
        return this.http.get<any[]>(`${this.apiUrl}/`, { params });
    }

    exportCsv(filters: { status?: string; date_from?: string; date_to?: string } = {}): Observable<Blob> {
        let params = new HttpParams();
        if (filters.status) params = params.set('status', filters.status);
        if (filters.date_from) params = params.set('date_from', filters.date_from);
        if (filters.date_to) params = params.set('date_to', filters.date_to);
        return this.http.get(`${this.apiUrl}/export/`, { params, responseType: 'blob' });
    }
}
