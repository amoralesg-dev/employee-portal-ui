import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '@rassini/rassini-ui';

export const requirePasswordChangeGuard: CanActivateFn = () => {
    const auth = inject(Auth);
    const router = inject(Router);
    const user = auth.currentUser();

    if (user && !user.forcePasswordChange) {
        router.navigate(['/']);
        return false;
    }
    return true;
};
