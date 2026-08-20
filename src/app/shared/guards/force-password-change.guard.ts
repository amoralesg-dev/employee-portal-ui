import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '@rassini/rassini-ui';

export const forcePasswordChangeGuard: CanActivateFn = () => {
    const auth = inject(Auth);
    const router = inject(Router);
    const user = auth.currentUser();

    if (user?.forcePasswordChange) {
        router.navigate(['/change-password-required']);
        return false;
    }
    return true;
};
