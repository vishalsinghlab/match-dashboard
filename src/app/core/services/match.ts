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

export interface MatchSettings {
    matchId: string;
    useGlobalDefaults?: boolean;
    updateInterval: number;
    dataType: 'SCORE' | 'FULL' | 'STATISTICS';
    binary: boolean;
    compression: boolean;
    socketEnabled: boolean;
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
    private readonly adminApiUrl = 'http://localhost:3000/api/admin';

    constructor(private readonly http: HttpClient) { }

    getMatches(): Observable<ApiResponse<Match[]>> {
        return this.http.get<ApiResponse<Match[]>>(this.apiUrl);
    }

    getMatchById(id: string): Observable<ApiResponse<Match>> {
        return this.http.get<ApiResponse<Match>>(`${this.apiUrl}/${id}`);
    }

    createMatch(
        match: Omit<Match, '_id' | 'createdAt' | 'updatedAt'>,
    ): Observable<ApiResponse<Match>> {
        return this.http.post<ApiResponse<Match>>(this.apiUrl, match);
    }

    getGlobalSettings(): Observable<Omit<MatchSettings, 'matchId'>> {
        return this.http.get<Omit<MatchSettings, 'matchId'>>(`${this.adminApiUrl}/settings/global`, { withCredentials: true });
    }

    updateGlobalSettings(settings: Partial<MatchSettings>): Observable<Omit<MatchSettings, 'matchId'>> {
        return this.http.put<Omit<MatchSettings, 'matchId'>>(`${this.adminApiUrl}/settings/global`, settings, { withCredentials: true });
    }

    getMatchSettings(matchId: string): Observable<MatchSettings> {
        return this.http.get<MatchSettings>(`${this.adminApiUrl}/matches/${matchId}/settings`, { withCredentials: true });
    }

    updateMatchSettings(matchId: string, settings: Partial<MatchSettings>): Observable<MatchSettings> {
        return this.http.put<MatchSettings>(`${this.adminApiUrl}/matches/${matchId}/settings`, settings, { withCredentials: true });
    }
}