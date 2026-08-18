import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';

import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe, UpperCasePipe } from '@angular/common';
import {
  Match,
  MatchService,
} from '../../../core/services/match';

import { MatchUpdate, RealtimeService } from '../../../core/services/realtime';
import { Auth } from '../../../core/services/auth';
import {
  BasketballData,
  CricketData,
  EsportsData,
  FootballData,
  FormattedFeedItem,
  GenericData,
  SportCategory,
  TennisData,
  formatSportFeedItem,
  generateBasketballTelemetry,
  generateCricketTelemetry,
  generateEsportsTelemetry,
  generateFootballTelemetry,
  generateGenericTelemetry,
  generateTennisTelemetry,
  normalizeSport,
} from '../../../core/models/sport-details.model';

export type DetailTab = 'overview' | 'stats' | 'lineups' | 'timeline' | 'admin';

@Component({
  selector: 'app-match-details',
  imports: [DatePipe, UpperCasePipe, RouterLink],
  templateUrl: './match-details.html',
  styleUrl: './match-details.css',
})
export class MatchDetails implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly matchService = inject(MatchService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly auth = inject(Auth);

  readonly match = signal<Match | null>(null);
  readonly matchId = signal<string>('');
  readonly socketConnected = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');
  readonly latestUpdate = signal<MatchUpdate | null>(null);
  readonly updatesHistory = signal<MatchUpdate[]>([]);
  readonly scorePulse = signal<boolean>(false);
  readonly activeTab = signal<DetailTab>('overview');

  readonly isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  readonly sportCategory = computed<SportCategory>(() => {
    return normalizeSport(this.match()?.sport);
  });

  readonly homeScore = computed(() => {
    return this.latestUpdate()?.score.home ?? 2;
  });

  readonly awayScore = computed(() => {
    return this.latestUpdate()?.score.away ?? 1;
  });

  readonly cricketData = computed<CricketData>(() => {
    const meta = (this.latestUpdate() as any)?.meta;
    return generateCricketTelemetry(this.homeScore(), this.awayScore(), meta);
  });

  readonly footballData = computed<FootballData>(() => {
    const meta = (this.latestUpdate() as any)?.meta;
    return generateFootballTelemetry(this.homeScore(), this.awayScore(), meta);
  });

  readonly basketballData = computed<BasketballData>(() => {
    const meta = (this.latestUpdate() as any)?.meta;
    return generateBasketballTelemetry(this.homeScore(), this.awayScore(), meta);
  });

  readonly tennisData = computed<TennisData>(() => {
    const meta = (this.latestUpdate() as any)?.meta;
    return generateTennisTelemetry(this.homeScore(), this.awayScore(), meta);
  });

  readonly esportsData = computed<EsportsData>(() => {
    const meta = (this.latestUpdate() as any)?.meta;
    return generateEsportsTelemetry(this.homeScore(), this.awayScore(), meta);
  });

  readonly genericData = computed<GenericData>(() => {
    return generateGenericTelemetry(this.homeScore(), this.awayScore());
  });

  private unbindListeners: Array<() => void> = [];
  private pulseTimeoutId: any = null;

  ngOnInit(): void {
    if (!this.auth.currentUser()) {
      this.auth.getCurrentUser().subscribe();
    }

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

        this.latestUpdate.set(update);
        this.updatesHistory.update((prev) => [update, ...prev].slice(0, 10));

        // Trigger micro-animation for score change
        this.triggerScorePulse();
      }),
    );

    this.realtimeService.connect();
  }

  setTab(tab: DetailTab): void {
    this.activeTab.set(tab);
  }

  private triggerScorePulse(): void {
    if (this.pulseTimeoutId) {
      clearTimeout(this.pulseTimeoutId);
    }
    this.scorePulse.set(true);
    this.pulseTimeoutId = setTimeout(() => {
      this.scorePulse.set(false);
    }, 1000);
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

  getEventIcon(sport: string | undefined): string {
    if (!sport) return 'fa-solid fa-bolt';
    const s = sport.toLowerCase();
    if (s.includes('football') || s.includes('soccer')) return 'fa-solid fa-futbol';
    if (s.includes('cricket')) return 'fa-solid fa-baseball-bat-ball';
    if (s.includes('basket')) return 'fa-solid fa-basketball';
    if (s.includes('tennis')) return 'fa-solid fa-table-tennis-paddle-ball';
    return 'fa-solid fa-bolt';
  }

  formatFeedItem(update: MatchUpdate): FormattedFeedItem {
    return formatSportFeedItem(update, this.sportCategory());
  }

  getBallBadgeClass(ball: string): string {
    if (ball === 'W') return 'ball-wicket';
    if (ball === '6') return 'ball-six';
    if (ball === '4') return 'ball-four';
    if (ball.includes('wd') || ball.includes('nb')) return 'ball-extra';
    return 'ball-normal';
  }

  getEventBadgeClass(type: string): string {
    if (type === 'goal') return 'event-goal';
    if (type === 'yellow_card') return 'event-yellow';
    if (type === 'red_card') return 'event-red';
    return 'event-sub';
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