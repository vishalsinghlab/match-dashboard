import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import {
  Match,
  MatchService,
} from '../../../core/services/match';

import { MatchUpdate, RealtimeService } from '../../../core/services/realtime';

@Component({
  selector: 'app-match-details',
  imports: [DatePipe, RouterLink],
  templateUrl: './match-details.html',
  styleUrl: './match-details.css',
})
export class MatchDetails implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly matchService = inject(MatchService);
  private readonly realtimeService = inject(RealtimeService);

  readonly match = signal<Match | null>(null);
  readonly matchId = signal<string>('');
  readonly socketConnected = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');
  readonly latestUpdate = signal<MatchUpdate | null>(null);

  private unbindListeners: Array<() => void> = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('matchId') ?? '';
    this.matchId.set(id);

    if (!id) {
      this.isLoading.set(false);
      this.errorMessage.set('Invalid match ID.');
      return;
    }

    this.loadMatch();

    if (this.realtimeService.isConnected()) {
      this.socketConnected.set(true);
      this.realtimeService.joinMatch(this.matchId());
    }

    this.unbindListeners.push(
      this.realtimeService.onConnect(() => {
        this.socketConnected.set(true);
        this.realtimeService.joinMatch(this.matchId());
      }),
    );

    this.unbindListeners.push(
      this.realtimeService.onDisconnect(() => {
        this.socketConnected.set(false);
      }),
    );

    this.unbindListeners.push(
      this.realtimeService.onError((err) => {
        console.error('Socket connection error:', err.message);
        this.socketConnected.set(false);
      }),
    );

    this.unbindListeners.push(
      this.realtimeService.onMatchUpdate((update) => {
        if (update.matchId !== this.matchId()) {
          return;
        }

        console.log('Match update received:', update);

        this.latestUpdate.set(update);
      }),
    );

    this.realtimeService.connect();
  }

  loadMatch(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.matchService.getMatchById(this.matchId()).subscribe({
      next: (response) => {
        this.match.set(response.data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load match:', error);
        this.errorMessage.set('Match fixture not found or failed to load details from server.');
        this.isLoading.set(false);
      },
    });
  }

  getSportIcon(sport: string | undefined): string {
    if (!sport) return 'fa-solid fa-trophy';
    const s = sport.toLowerCase();
    if (s.includes('cricket')) return 'fa-solid fa-baseball-bat-ball';
    if (s.includes('football') || s.includes('soccer')) return 'fa-solid fa-futbol';
    if (s.includes('basket')) return 'fa-solid fa-basketball';
    if (s.includes('tennis')) return 'fa-solid fa-table-tennis-paddle-ball';
    if (s.includes('esport') || s.includes('gaming')) return 'fa-solid fa-gamepad';
    if (s.includes('racing') || s.includes('f1')) return 'fa-solid fa-flag-checkered';
    return 'fa-solid fa-trophy';
  }

  ngOnDestroy(): void {
    if (this.matchId()) {
      this.realtimeService.leaveMatch(this.matchId());
    }

    for (const unbind of this.unbindListeners) {
      unbind();
    }
    this.unbindListeners = [];
  }
}