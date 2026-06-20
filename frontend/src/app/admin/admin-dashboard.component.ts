import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { API_BASE_URL } from '../config/api.config';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faCheckCircle, faTrash, faShieldAlt } from '@fortawesome/free-solid-svg-icons';

@Component({
    selector: 'app-admin-dashboard',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
    faCheckCircle = faCheckCircle;
    faTrash = faTrash;
    faShieldAlt = faShieldAlt;

    http = inject(HttpClient);
    authService = inject(AuthService);
    router = inject(Router);

    providers: any[] = [];
    reviews: any[] = [];
    isLoadingProviders = false;
    isLoadingReviews = false;
    activeTab = 'providers';

    ngOnInit() {
        if (this.authService.getUserRole() !== 'ADMIN') {
            this.router.navigate(['/']);
            return;
        }
        this.loadProviders();
        this.loadReviews();
    }

    loadProviders() {
        this.isLoadingProviders = true;
        this.http.get<any[]>(`${API_BASE_URL}/api/auth/providers/`).subscribe({
            next: (data: any[]) => {
                this.providers = data;
                this.isLoadingProviders = false;
            },
            error: (err: any) => {
                console.error(err);
                this.isLoadingProviders = false;
            }
        });
    }

    loadReviews() {
        this.isLoadingReviews = true;
        this.http.get<any[]>(`${API_BASE_URL}/api/reviews/`).subscribe({
            next: (data: any[]) => {
                this.reviews = data;
                this.isLoadingReviews = false;
            },
            error: (err: any) => {
                console.error(err);
                this.isLoadingReviews = false;
            }
        });
    }

    verifyProvider(id: string) {
        if (!confirm('Voulez-vous vraiment valider ce prestataire ?')) return;
        this.http.post(`${API_BASE_URL}/api/auth/admin/providers/${id}/verify/`, {}).subscribe({
            next: () => {
                alert('Prestataire validé avec succès.');
                this.loadProviders();
            },
            error: (err: any) => alert('Erreur lors de la validation.')
        });
    }

    deleteReview(id: number) {
        if (!confirm('Voulez-vous vraiment supprimer cet avis ?')) return;
        this.http.delete(`${API_BASE_URL}/api/reviews/${id}/`).subscribe({
            next: () => {
                alert('Avis supprimé.');
                this.loadReviews();
            },
            error: (err: any) => alert('Erreur lors de la suppression.')
        });
    }
}
