import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '../services/auth';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = () => {
    const auth = inject(Auth);
    const router = inject(Router);

    if (auth.currentUser()) {
        return true;
    }

    return auth.getCurrentUser().pipe(
        map((res) => {
            if (res?.authenticated) {
                return true;
            }
            return router.createUrlTree(['/login']);
        }),
    );
};

export const adminGuard: CanActivateFn = () => {
    const auth = inject(Auth);
    const router = inject(Router);

    const user = auth.currentUser();
    if (user) {
        if (user.role === 'ADMIN') {
            return true;
        }
        return router.createUrlTree(['/matches']);
    }

    return auth.getCurrentUser().pipe(
        map((res) => {
            if (res?.authenticated && res.session?.role === 'ADMIN') {
                return true;
            }
            return router.createUrlTree(['/login']);
        }),
    );
};
