import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    message: string;
    type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private toastSubject = new BehaviorSubject<Toast | null>(null);
    toast$ = this.toastSubject.asObservable();

    show(message: string, type: 'success' | 'error' | 'info' = 'info') {
        this.toastSubject.next({ message, type });
        setTimeout(() => this.toastSubject.next(null), 4000);
    }

    success(message: string) { this.show(message, 'success'); }
    error(message: string) { this.show(message, 'error'); }
    info(message: string) { this.show(message, 'info'); }
}
