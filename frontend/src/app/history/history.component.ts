import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HistoryService } from '../services/history.service';

@Component({
    selector: 'app-history',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './history.component.html',
    styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {
    appointments: any[] = [];
    isLoading = false;
    filters = { status: '', date_from: '', date_to: '' };

    STATUSES = [
        { value: '', label: 'Tous les statuts' },
        { value: 'COMPLETED', label: 'Terminés' },
        { value: 'CANCELLED', label: 'Annulés' },
        { value: 'PENDING', label: 'En attente' },
        { value: 'ACCEPTED', label: 'Acceptés' },
        { value: 'IN_PROGRESS', label: 'En cours' },
    ];

    constructor(private historyService: HistoryService) { }

    ngOnInit() { this.load(); }

    load() {
        this.isLoading = true;
        this.historyService.getHistory(this.filters).subscribe({
            next: (data: any[]) => { this.appointments = data; this.isLoading = false; },
            error: () => this.isLoading = false
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
