import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProviderService } from '../../services/provider.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faMapMarkerAlt, faEuroSign } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FontAwesomeModule],
  templateUrl: './provider-list.component.html',
  styleUrl: './provider-list.component.css'
})
export class ProviderListComponent implements OnInit {
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

  ngOnInit(): void {
    this.loadProviders();
  }

  loadProviders(): void {
    this.isLoading = true;
    this.providerService.getProviders({
      city: this.selectedCity,
      specialty: this.selectedSpecialty,
      search: this.searchQuery
    }).subscribe({
      next: (data) => {
        this.providers = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.selectedCity = '';
    this.selectedSpecialty = '';
    this.loadProviders();
  }
}
