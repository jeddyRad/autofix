import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryService } from '../services/history.service';
import { timer, Subscription } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faDownload, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-history',
    standalone: true,
    imports: [CommonModule, FormsModule, FontAwesomeModule],
    templateUrl: './history.component.html',
    styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit, OnDestroy {
    appointments: any[] = [];
    isLoading = false;
    filters = { status: '', date_from: '', date_to: '' };
    faDownload = faDownload;
    faCheckCircle = faCheckCircle;
    private pollingSub!: Subscription;

    STATUSES = [
        { value: '', label: 'Tous les statuts' },
        { value: 'COMPLETED', label: 'Terminés' },
        { value: 'CANCELLED', label: 'Annulés' },
        { value: 'PENDING', label: 'En attente' },
        { value: 'ACCEPTED', label: 'Acceptés' },
        { value: 'IN_PROGRESS', label: 'En cours' },
    ];

    constructor(private historyService: HistoryService) { }

    ngOnInit() {
        this.load();
        this.pollingSub = timer(10000, 10000).subscribe(() => {
            this.silentLoad();
        });
    }

    ngOnDestroy() {
        if (this.pollingSub) {
            this.pollingSub.unsubscribe();
        }
    }

    load() {
        this.isLoading = true;
        this.historyService.getHistory(this.filters).subscribe({
            next: (data: any[]) => { this.appointments = data; this.isLoading = false; },
            error: () => this.isLoading = false
        });
    }

    silentLoad() {
        this.historyService.getHistory(this.filters).subscribe({
            next: (data: any[]) => { this.appointments = data; },
            error: () => { }
        });
    }

    exportCsv() {
        this.historyService.exportCsv(this.filters).subscribe({
            next: (blob: Blob) => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'historique-interventions.csv';
                a.click();
                URL.revokeObjectURL(url);
            }
        });
    }

    statusLabel(status: string): string {
        const map: Record<string, string> = {
            PENDING: 'En attente', ACCEPTED: 'Accepté', IN_PROGRESS: 'En cours',
            COMPLETED: 'Terminé', CANCELLED: 'Annulé'
        };
        return map[status] || status;
    }
}
