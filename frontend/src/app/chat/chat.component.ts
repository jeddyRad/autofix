import { Component, OnInit, OnDestroy, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/auth.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCommentDots, faPaperPlane } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  chatService = inject(ChatService);
  authService = inject(AuthService);
  route = inject(ActivatedRoute);
  faCommentDots = faCommentDots;
  faPaperPlane = faPaperPlane;

  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  conversations: any[] = [];
  messages: any[] = [];
  selectedPartner: any = null;
  newMessage = '';
  isLoading = true;

  private pollInterval: any = null;

  ngOnInit(): void {
    this.loadConversations();

    // Check if partner was passed via query params (from provider detail page)
    this.route.queryParams.subscribe(params => {
      if (params['partner']) {
        this.selectPartnerById(params['partner']);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  loadConversations(): void {
    this.isLoading = true;
    this.chatService.getConversations().subscribe({
      next: (data) => {
        this.conversations = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  selectPartner(conversation: any): void {
    this.selectedPartner = conversation.partner;
    this.loadMessages(true);
    this.startPolling();
  }

  selectPartnerById(partnerId: string): void {
    this.selectedPartner = { id: partnerId };
    this.loadMessages(true);
    this.startPolling();
  }

  loadMessages(autoScroll: boolean = false): void {
    if (!this.selectedPartner) return;
    this.chatService.getHistory(this.selectedPartner.id).subscribe({
      next: (data: any[]) => {
        const atBottom = this.isAtBottom();
        const isNewMessage = this.messages.length !== data.length;
        this.messages = data;
        if (autoScroll || (isNewMessage && atBottom)) {
          setTimeout(() => this.scrollToBottom(), 100);
        }
        // Notify that unread count may have decreased
        this.chatService.triggerUnreadRefresh();
      },
      error: (err: any) => console.error(err)
    });
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.selectedPartner) return;

    this.chatService.sendMessage(this.selectedPartner.id, this.newMessage.trim()).subscribe({
      next: () => {
        this.newMessage = '';
        this.loadMessages(true);
        this.loadConversations();
      },
      error: (err) => console.error(err)
    });
  }

  startPolling(): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      this.loadMessages();
    }, 3000);
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (e) { }
  }

  isAtBottom(): boolean {
    if (!this.messagesContainer) return true;
    const el = this.messagesContainer.nativeElement;
    return Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 100;
  }

  trackById(index: number, item: any): any {
    return item.id || index;
  }

  isOwnMessage(msg: any): boolean {
    const userId = this.authService.currentUser()?.id;
    return msg.sender === userId || msg.sender_email === this.authService.currentUser()?.email;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }
}
