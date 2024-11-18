import { RouterModule, Routes } from '@angular/router';
import {
  AuthGuard,
  redirectLoggedInTo,
  redirectUnauthorizedTo,
} from '@angular/fire/auth-guard';
import { LoginPageComponent } from './pages/login-page/login-page.component';
import { ChatPageComponent } from './pages/chat-page/chat-page.component';
import {JobChatPageComponent} from './pages/job-chat-page/job-chat-page.component';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);
const redirectLoggedInToHome = () => redirectLoggedInTo(['chat']);

export const routes: Routes = [
  {
    path: '',
    component: LoginPageComponent,
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectLoggedInToHome },
  },
  {
    path: 'login',
    component: LoginPageComponent,
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectLoggedInToHome },
  },
  {
    path: 'jobs',
    component: ChatPageComponent,
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  },
  {
    path: 'job-chat/:job_id',
    component: JobChatPageComponent,
    canActivate: [AuthGuard],
    data: { authGuardPipe: redirectUnauthorizedToLogin },
  }
];
