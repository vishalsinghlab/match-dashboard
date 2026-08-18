import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Match,
  MatchService,
} from '../../../core/services/match';
import { Auth } from '../../../core/services/auth';

export type FilterStatus = 'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED';
export type SortOption = 'STATUS' | 'NEWEST_CREATED' | 'TIME_ASC' | 'TIME_DESC' | 'SPORT' | 'NAME';

@Component({
  selector: 'app-user-matches',
  imports: [RouterLink, DatePipe, FormsModule],
  templateUrl: './matches.html',
  styleUrl: './matches.css',
})
export class Matches implements OnInit {
  private readonly matchService = inject(MatchService);
  private readonly auth = inject(Auth);

  readonly matches = signal<Match[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string>('');

  readonly activeFilter = signal<FilterStatus>('ALL');
  readonly searchQuery = signal<string>('');
  readonly sortBy = signal<SortOption>('STATUS');

  readonly isAdmin = computed(() => this.auth.currentUser()?.role === 'ADMIN');

  readonly filteredMatches = computed(() => {
    const matches = this.matches();
    const filter = this.activeFilter();
    const query = this.searchQuery().toLowerCase().trim();
    const sort = this.sortBy();

    const result = matches.filter((match) => {
      const matchesFilter = filter === 'ALL' || match.status === filter;
      const matchesSearch =
        !query ||
        match.name.toLowerCase().includes(query) ||
        match.sport.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });

    const statusPriority: Record<string, number> = { LIVE: 1, UPCOMING: 2, COMPLETED: 3 };

    return result.sort((a, b) => {
      const createdA = new Date(a.createdAt || a.startTime).getTime();
      const createdB = new Date(b.createdAt || b.startTime).getTime();

      if (sort === 'STATUS') {
        const priorityA = statusPriority[a.status] ?? 4;
        const priorityB = statusPriority[b.status] ?? 4;
        if (priorityA !== priorityB) return priorityA - priorityB;
        return createdB - createdA;
      } else if (sort === 'NEWEST_CREATED') {
        return createdB - createdA;
      } else if (sort === 'TIME_ASC') {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      } else if (sort === 'TIME_DESC') {
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      } else if (sort === 'SPORT') {
        return a.sport.localeCompare(b.sport);
      } else if (sort === 'NAME') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  });

  readonly totalCount = computed(() => this.matches().length);
  readonly liveCount = computed(() => this.matches().filter((m) => m.status === 'LIVE').length);
  readonly upcomingCount = computed(() => this.matches().filter((m) => m.status === 'UPCOMING').length);
  readonly completedCount = computed(() => this.matches().filter((m) => m.status === 'COMPLETED').length);

  ngOnInit(): void {
    if (!this.auth.currentUser()) {
      this.auth.getCurrentUser().subscribe();
    }
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

  setSort(sort: SortOption): void {
    this.sortBy.set(sort);
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