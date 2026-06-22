import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProviderService } from '../../services/provider.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMapMarkerAlt, faEuroSign, faLocationArrow, faSpinner } from '@fortawesome/free-solid-svg-icons';
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
  faLocationArrow = faLocationArrow;
  faSpinner = faSpinner;

  providers: any[] = [];

  searchQuery = '';
  selectedCity = '';
  selectedSpecialty = '';

  // Geolocation state
  userLat: number | null = null;
  userLng: number | null = null;
  isGeoLoading = false;
  geoError: string | null = null;
  geoActive = false;

  isLoading = false;

  cities = ['Antananarivo', 'Tamatave', 'Majunga', 'Antsirabe', 'Fianarantsoa', 'Tulear', 'Diego Suarez'];
  specialties = [
    { value: 'MECANICIEN', label: 'Mécanicien' },
    { value: 'DEPANNAGE', label: 'Dépannage / Remorquage' },
    { value: 'GARAGE', label: 'Garage complet' }
  ];

  private providerService = inject(ProviderService);
  private filterSubject = new Subject<{ city: string; specialty: string; search: string; lat?: number; lng?: number }>();
  private filterSub!: Subscription;

  ngOnInit(): void {
    this.filterSub = this.filterSubject.pipe(
      debounceTime(300),
      distinctUntilChanged((prev, curr) =>
        prev.city === curr.city &&
        prev.specialty === curr.specialty &&
        prev.search === curr.search &&
        prev.lat === curr.lat &&
        prev.lng === curr.lng
      ),
      tap(() => this.isLoading = true),
      switchMap((filters) => this.providerService.getProviders(filters))
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
    const filter: any = {
      city: this.selectedCity,
      specialty: this.selectedSpecialty,
      search: this.searchQuery,
    };
    if (this.geoActive && this.userLat != null && this.userLng != null) {
      filter.lat = this.userLat;
      filter.lng = this.userLng;
    }
    this.filterSubject.next(filter);
  }

  async useMyLocation(): Promise<void> {
    this.isGeoLoading = true;
    this.geoError = null;
    try {
      const pos = await this.providerService.getUserPosition();
      this.userLat = pos.coords.latitude;
      this.userLng = pos.coords.longitude;
      this.geoActive = true;
      // Clear city filter — geo search covers all cities in radius
      this.selectedCity = '';
      this.triggerFilter();
    } catch (err: any) {
      this.geoError = err.code === 1
        ? 'Géolocalisation refusée. Activez-la dans les paramètres du navigateur.'
        : 'Impossible de récupérer votre position. Réessayez.';
    } finally {
      this.isGeoLoading = false;
    }
  }

  clearGeo(): void {
    this.userLat = null;
    this.userLng = null;
    this.geoActive = false;
    this.geoError = null;
    this.triggerFilter();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCity = '';
    this.selectedSpecialty = '';
    this.clearGeo();
  }
}
