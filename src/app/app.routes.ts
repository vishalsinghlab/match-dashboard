import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
            import('./features/auth/login/login')
                .then((m) => m.Login),
    },
    {
        path: 'admin/matches',
        canActivate: [adminGuard],
        loadComponent: () =>
            import('./features/admin/matches/matches').then(
                (m) => m.Matches,
            ),
    },

    {
        path: 'matches',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/user/matches/matches').then(
                (m) => m.Matches,
            ),
    },

    {
        path: 'matches/:matchId',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./features/user/match-details/match-details').then(
                (m) => m.MatchDetails,
            ),
    },

    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
    },
];