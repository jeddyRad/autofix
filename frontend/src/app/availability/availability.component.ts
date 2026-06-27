import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvailabilityService } from '../services/availability.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlusCircle, faTrash, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-availability',
    standalone: true,
    imports: [CommonModule, FormsModule, FontAwesomeModule],
    templateUrl: './availability.component.html',
    styleUrl: './availability.component.css'
})
export class AvailabilityComponent implements OnInit {
    slots: any[] = [];
    isLoading = false;
    faPlusCircle = faPlusCircle;
    faTrash = faTrash;
    faExclamationCircle = faExclamationCircle;

    // Modal Delete
    showDeleteModal = false;
    slotToDelete: number | null = null;

    WEEKDAYS = [
        { value: 0, label: 'Lundi' },
        { value: 1, label: 'Mardi' },
        { value: 2, label: 'Mercredi' },
        { value: 3, label: 'Jeudi' },
        { value: 4, label: 'Vendredi' },
        { value: 5, label: 'Samedi' },
        { value: 6, label: 'Dimanche' },
    ];

    newSlot = { weekday: 0, start_time: '09:00', end_time: '17:00' };
    errorMessage = '';
    successMessage = '';
    isAddingSlot = false;

    constructor(private availabilityService: AvailabilityService) { }

    ngOnInit() { this.loadSlots(); }

    loadSlots() {
        this.isLoading = true;
        this.availabilityService.getMySlots().subscribe({
            next: (data: any[]) => { this.slots = data; this.isLoading = false; },
            error: () => this.isLoading = false
        });
    }

    addSlot() {
        this.errorMessage = '';
        this.successMessage = '';
        if (this.newSlot.start_time >= this.newSlot.end_time) {
            this.errorMessage = 'L\'heure de fin doit être après l\'heure de début.';
            return;
        }
        this.isAddingSlot = true;
        this.availabilityService.addSlot(this.newSlot).subscribe({
            next: () => {
                this.isAddingSlot = false;
                this.successMessage = 'Créneau ajouté avec succès !';
                this.newSlot = { weekday: 0, start_time: '09:00', end_time: '17:00' };
                this.loadSlots();
                setTimeout(() => this.successMessage = '', 3500);
            },
            error: (err: any) => {
                this.isAddingSlot = false;
                this.errorMessage = err?.error?.non_field_errors?.[0] || 'Erreur lors de l\'ajout.';
            }
        });
    }

    deleteSlot(id: number) {
        this.slotToDelete = id;
        this.showDeleteModal = true;
    }

    confirmDelete() {
        if (this.slotToDelete) {
            this.availabilityService.deleteSlot(this.slotToDelete).subscribe({
                next: () => {
                    this.loadSlots();
                    this.cancelDelete();
                }
            });
        }
    }

    cancelDelete() {
        this.showDeleteModal = false;
        this.slotToDelete = null;
    }

    weekdayLabel(day: number): string {
        return this.WEEKDAYS.find(w => w.value === day)?.label || String(day);
    }

    slotsByDay(day: number): any[] {
        return this.slots.filter(s => s.weekday === day);
    }
}
