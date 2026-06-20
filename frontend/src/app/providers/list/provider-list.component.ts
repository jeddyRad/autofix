import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProviderService } from '../../services/provider.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMapMarkerAlt, faEuroSign } from '@fortawesome/free-solid-svg-icons';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './provider-list.component.html',
  styleUrl: './provider-list.component.css'
})
export class ProviderListComponent implements OnInit, OnDestroy {
  faMapMarkerAlt = faMapMarkerAlt;
  faEuroSign = faEuroSign;
  providers: any[] = [];

  searchQuery = '';
  selectedCity = '';
  selectedSpecialty = '';

  isLoading = false;

  cities = ['Antananarivo', 'Tamatave', 'Majunga', 'Antsirabe', 'Fianarantsoa', 'Tulear', 'Diego Suarez'];
  specialties = [
    { value: 'MECANICIEN', label: 'Mécanicien' },
    { value: 'DEPANNAGE', label: 'Dépannage / Remorquage' },
    { value: 'GARAGE', label: 'Garage complet' }
  ];

  private providerService = inject(ProviderService);
  private filterSubject = new Subject<{ city: string; specialty: string; search: string }>();
  private filterSub!: Subscription;

  ngOnInit(): void {
    this.filterSub = this.filterSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((prev: { city: string; specialty: string; search: string }, curr: { city: string; specialty: string; search: string }) =>
        prev.city === curr.city && prev.specialty === curr.specialty && prev.search === curr.search
      ),
      tap(() => this.isLoading = true),
      switchMap((filters: { city: string; specialty: string; search: string }) => this.providerService.getProviders(filters))
    ).subscribe({
      next: (data: any[]) => {
        this.providers = data;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
      }
    });

    // Initial load
    this.triggerFilter();
  }

  ngOnDestroy(): void {
    if (this.filterSub) {
      this.filterSub.unsubscribe();
    }
  }

  onFilterChange(): void {
    this.triggerFilter();
  }

  triggerFilter(): void {
    this.filterSubject.next({
      city: this.selectedCity,
      specialty: this.selectedSpecialty,
      search: this.searchQuery
    });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCity = '';
    this.selectedSpecialty = '';
    this.triggerFilter();
  }
}
