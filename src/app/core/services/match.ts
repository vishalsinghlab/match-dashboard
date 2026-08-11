import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Match {
    _id: string;
    name: string;
    sport: string;
    status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
    startTime: string;
    socketEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
}

@Injectable({
    providedIn: 'root',
})
export class MatchService {
    private readonly apiUrl = 'http://localhost:3000/api/matches';

    constructor(private readonly http: HttpClient) { }

    getMatches(): Observable<ApiResponse<Match[]>> {
        return this.http.get<ApiResponse<Match[]>>(this.apiUrl);
    }

    createMatch(
        match: Omit<Match, '_id' | 'createdAt' | 'updatedAt'>,
    ): Observable<ApiResponse<Match>> {
        return this.http.post<ApiResponse<Match>>(this.apiUrl, match);
    }
}