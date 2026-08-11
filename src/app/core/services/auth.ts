import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';

interface LoginCredentials {
    username: string;
    password: string;
}

export interface UserSession {
    id: string;
    username: string;
    role: 'ADMIN' | 'USER';
}

interface LoginResponse {
    user: UserSession;
}

interface MeResponse {
    authenticated: boolean;
    session: {
        userId: string;
        role: 'ADMIN' | 'USER';
    };
}

@Injectable({
    providedIn: 'root',
})
export class Auth {
    private readonly http = inject(HttpClient);

    private readonly apiUrl = 'http://localhost:3000/api/auth';

    readonly currentUser = signal<UserSession | null>(null);

    login(
        credentials: LoginCredentials,
    ): Observable<LoginResponse> {
        return this.http.post<LoginResponse>(
            `${this.apiUrl}/login`,
            credentials,
            {
                withCredentials: true,
            },
        ).pipe(
            tap((res) => {
                this.currentUser.set(res.user);
            }),
        );
    }

    logout(): Observable<{ message: string }> {
        return this.http.post<{ message: string }>(
            `${this.apiUrl}/logout`,
            {},
            {
                withCredentials: true,
            },
        ).pipe(
            tap(() => {
                this.currentUser.set(null);
            }),
        );
    }

    getCurrentUser(): Observable<MeResponse | null> {
        return this.http.get<MeResponse>(
            `${this.apiUrl}/me`,
            {
                withCredentials: true,
            },
        ).pipe(
            tap((res) => {
                if (res.authenticated && res.session) {
                    this.currentUser.set({
                        id: res.session.userId,
                        username: res.session.role === 'ADMIN' ? 'admin' : 'user',
                        role: res.session.role,
                    });
                } else {
                    this.currentUser.set(null);
                }
            }),
            catchError(() => {
                this.currentUser.set(null);
                return of(null);
            }),
        );
    }
}