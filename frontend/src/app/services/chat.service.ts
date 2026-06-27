import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = `${API_BASE_URL}/api/chat`;

  private unreadCountSubject = new Subject<void>();
  unreadCount$ = this.unreadCountSubject.asObservable();

  getConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/conversations/`);
  }

  getHistory(partnerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/${partnerId}/`);
  }

  sendMessage(receiverId: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send/`, { receiver: receiverId, content }).pipe(
      tap(() => this.unreadCountSubject.next())
    );
  }

  getUnreadTotal(): Observable<{ unread_total: number }> {
    return this.http.get<{ unread_total: number }>(`${this.apiUrl}/unread-total/`);
  }

  triggerUnreadRefresh(): void {
    this.unreadCountSubject.next();
  }
}
