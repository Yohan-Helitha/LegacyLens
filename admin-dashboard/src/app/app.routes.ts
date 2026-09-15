import { Routes } from '@angular/router';
import { LoginComponent } from '../pages/auth/login/login.component';
import { RegisterComponent } from '../pages/auth/register/register.component';
import { DashboardComponent } from '../pages/dashboard/dashboard.component';
import { ModerationComponent } from '../pages/moderation/moderation.component';
import { OpportunityIntakeComponent } from '../pages/opportunity-intake/opportunity-intake.component';
import { DisputesComponent } from '../pages/disputes/disputes.component';
import { VerificationComponent } from '../pages/verification/verification.component';
import { MapComponent } from '../pages/map/map.component';
import { AnalyticsComponent } from '../pages/analytics/analytics.component';
import { AdminManagementComponent } from '../pages/admin-management/admin-management.component';
import { ProfileManagementComponent } from '../pages/profile-management/profile-management.component';
import { AdminProfileComponent } from '../pages/admin-profile/admin-profile.component';
import { AuditComponent } from '../pages/audit/audit.component';
import { WordOfTheDayComponent } from '../pages/word-of-the-day/word-of-the-day.component';
import { NotificationsComponent } from '../pages/notifications/notifications.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'moderation',
    component: ModerationComponent,
    canActivate: [authGuard]
  },
  {
    path: 'opportunity-intake',
    component: OpportunityIntakeComponent,
    canActivate: [authGuard]
  },
  {
    path: 'opportunities',
    redirectTo: 'opportunity-intake'
  },
  {
    path: 'opportunity-management',
    redirectTo: 'opportunity-intake'
  },
  {
    path: 'opportunity-create',
    redirectTo: 'opportunity-intake'
  },
  {
    path: 'opportunity-drafts',
    redirectTo: 'opportunity-intake'
  },
  {
    path: 'intake',
    redirectTo: 'opportunity-intake'
  },
  {
    path: 'moderation-queue',
    redirectTo: 'moderation'
  },
  {
    path: 'content-and-archive',
    redirectTo: 'moderation'
  },
  {
    path: 'disputes',
    component: DisputesComponent,
    canActivate: [authGuard]
  },
  {
    path: 'dispute-queue',
    redirectTo: 'disputes'
  },
  {
    path: 'disputes-and-ethics',
    redirectTo: 'disputes'
  },
  {
    path: 'verification',
    component: VerificationComponent,
    canActivate: [authGuard]
  },
  {
    path: 'verifications',
    redirectTo: 'verification'
  },
  {
    path: 'profile-verification',
    redirectTo: 'verification'
  },
  {
    path: 'elder-credentials-verification',
    redirectTo: 'verification'
  },
  {
    path: 'map',
    component: MapComponent,
    canActivate: [authGuard]
  },
  {
    path: 'map-management',
    redirectTo: 'map'
  },
  {
    path: 'cultural-map',
    redirectTo: 'map'
  },
  {
    path: 'word-of-the-day',
    component: WordOfTheDayComponent,
    canActivate: [authGuard]
  },
  {
    path: 'analytics',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  {
    path: 'platform-analytics',
    redirectTo: 'analytics'
  },
  {
    path: 'admin-management',
    component: AdminManagementComponent,
    canActivate: [authGuard]
  },
  {
    path: 'adminManagement',
    redirectTo: 'admin-management'
  },
  {
    path: 'admin-manage',
    redirectTo: 'admin-management'
  },
  {
    path: 'access-control',
    redirectTo: 'admin-management'
  },
  {
    path: 'access-components',
    redirectTo: 'admin-management'
  },
  {
    path: 'admin-and-access-control',
    redirectTo: 'admin-management'
  },
  {
    path: 'profile-management',
    redirectTo: 'verification'
  },
  {
    path: 'profileManagement',
    redirectTo: 'verification'
  },
  {
    path: 'community-profiles',
    redirectTo: 'verification'
  },
  {
    path: 'admin-profile',
    component: AdminProfileComponent,
    canActivate: [authGuard]
  },
  {
    path: 'adminProfile',
    redirectTo: 'admin-profile'
  },
  {
    path: 'admin-profile-and-credentials',
    redirectTo: 'admin-profile'
  },
  {
    path: 'audit',
    component: AuditComponent,
    canActivate: [authGuard]
  },
  {
    path: 'audit-log',
    redirectTo: 'audit'
  },
  {
    path: 'audit-logs',
    redirectTo: 'audit'
  },
  {
    path: 'admin-profile-and-audit-logs',
    redirectTo: 'audit'
  },
  {
    path: 'notifications',
    component: NotificationsComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
