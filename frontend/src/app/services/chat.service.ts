import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://localhost:8000/api/chat';

  constructor(private http: HttpClient) {}

  getConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/conversations/`);
  }

  getHistory(partnerId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/${partnerId}/`);
  }

  sendMessage(receiverId: string, content: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send/`, { receiver: receiverId, content });
  }
}
