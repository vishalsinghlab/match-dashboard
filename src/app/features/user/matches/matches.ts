import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Match,
  MatchService,
} from '../../../core/services/match';

export type FilterStatus = 'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED';

@Component({
  selector: 'app-user-matches',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './matches.html',
  styleUrl: './matches.css',
})
export class Matches implements OnInit {
  private readonly matchService = inject(MatchService);

  readonly matches = signal<Match[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');

  readonly activeFilter = signal<FilterStatus>('ALL');
  readonly searchQuery = signal<string>('');

  readonly filteredMatches = computed(() => {
    const matches = this.matches();
    const filter = this.activeFilter();
    const query = this.searchQuery().toLowerCase().trim();

    return matches.filter((match) => {
      const matchesFilter = filter === 'ALL' || match.status === filter;
      const matchesSearch =
        !query ||
        match.name.toLowerCase().includes(query) ||
        match.sport.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  });

  readonly totalCount = computed(() => this.matches().length);
  readonly liveCount = computed(() => this.matches().filter((m) => m.status === 'LIVE').length);
  readonly upcomingCount = computed(() => this.matches().filter((m) => m.status === 'UPCOMING').length);
  readonly completedCount = computed(() => this.matches().filter((m) => m.status === 'COMPLETED').length);

  ngOnInit(): void {
    this.loadMatches();
  }

  loadMatches(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    this.matchService.getMatches().subscribe({
      next: (response) => {
        this.matches.set(response.data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load matches:', error);
        this.errorMessage.set('Unable to load matches. Please check server connection.');
        this.isLoading.set(false);
      },
    });
  }

  setFilter(filter: FilterStatus): void {
    this.activeFilter.set(filter);
  }

  getSportIcon(sport: string): string {
    const s = sport ? sport.toLowerCase() : '';
    if (s.includes('cricket')) return 'fa-solid fa-baseball-bat-ball';
    if (s.includes('football') || s.includes('soccer')) return 'fa-solid fa-futbol';
    if (s.includes('basket')) return 'fa-solid fa-basketball';
    if (s.includes('tennis')) return 'fa-solid fa-table-tennis-paddle-ball';
    if (s.includes('esport') || s.includes('gaming')) return 'fa-solid fa-gamepad';
    if (s.includes('racing') || s.includes('f1')) return 'fa-solid fa-flag-checkered';
    return 'fa-solid fa-trophy';
  }
}