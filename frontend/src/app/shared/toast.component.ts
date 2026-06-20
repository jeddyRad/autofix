import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from './toast.service';

@Component({
    selector: 'app-toast',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div *ngIf="toast" class="toast-container" [ngClass]="toast.type">
      {{ toast.message }}
    </div>
  `,
    styles: [`
    .toast-container {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      color: #fff;
      z-index: 9999;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
    }
    .toast-container.success { background: #1e8e3e; }
    .toast-container.error { background: #c0392b; }
    .toast-container.info { background: #2980b9; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
    toast: Toast | null = null;
    private sub!: Subscription;

    constructor(private toastService: ToastService) { }

    ngOnInit() {
        this.sub = this.toastService.toast$.subscribe(t => this.toast = t);
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }
}
