import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomeComponent } from './home/home.component';
import { ProviderListComponent } from './providers/list/provider-list.component';
import { ProviderDetailComponent } from './providers/detail/provider-detail.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ChatComponent } from './chat/chat.component';
import { PaymentSuccessComponent } from './payments/success/payment-success.component';
import { PaymentCancelComponent } from './payments/cancel/payment-cancel.component';
import { ProfileComponent } from './profile/profile.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { AdminDashboardComponent } from './admin/admin-dashboard.component';
import { AvailabilityComponent } from './availability/availability.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'providers', component: ProviderListComponent },
  { path: 'providers/:id', component: ProviderDetailComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [roleGuard('ADMIN')] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  { path: 'availability', component: AvailabilityComponent, canActivate: [roleGuard('PROVIDER')] },
  { path: 'payment/success', component: PaymentSuccessComponent, canActivate: [authGuard] },
  { path: 'payment/cancel', component: PaymentCancelComponent, canActivate: [authGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: '**', redirectTo: '' }
];
