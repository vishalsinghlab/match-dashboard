import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DatePipe, SlicePipe } from "@angular/common";
import { RouterLink } from '@angular/router';

import { Match, MatchService } from '../../../core/services/match';
import { RealtimeService } from '../../../core/services/realtime';

export type FilterStatus = 'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED';

@Component({
  selector: 'app-matches',
  imports: [ReactiveFormsModule, FormsModule, DatePipe, SlicePipe, RouterLink],
  templateUrl: './matches.html',
  styleUrl: './matches.css',
})
export class Matches implements OnInit {
  private readonly matchService = inject(MatchService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly realtimeService = inject(RealtimeService);

  readonly matches = signal<Match[]>([]);
  readonly isSubmitting = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);
  readonly isRefreshing = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  readonly activeFilter = signal<FilterStatus>('ALL');
  readonly searchQuery = signal<string>('');

  readonly popularSports = ['Cricket', 'Football', 'Basketball', 'Tennis', 'Esports'];

  readonly matchForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    sport: ['', Validators.required],
    status: ['UPCOMING' as Match['status'], Validators.required],
    startTime: ['', Validators.required],
    socketEnabled: [true],
  });

  readonly filteredMatches = computed(() => {
    const matches = this.matches();
    const filter = this.activeFilter();
    const query = this.searchQuery().toLowerCase().trim();

    return matches.filter((match) => {
      const matchesFilter =
        filter === 'ALL' || match.status === filter;
      const matchesSearch =
        !query ||
        match.name.toLowerCase().includes(query) ||
        match.sport.toLowerCase().includes(query);
      return matchesFilter && matchesSearch;
    });
  });

  readonly totalCount = computed(() => this.matches().length);

  readonly liveCount = computed(() =>
    this.matches().filter((m) => m.status === 'LIVE').length
  );

  readonly upcomingCount = computed(() =>
    this.matches().filter((m) => m.status === 'UPCOMING').length
  );

  readonly completedCount = computed(() =>
    this.matches().filter((m) => m.status === 'COMPLETED').length
  );

  ngOnInit(): void {
    this.loadMatches();

    this.realtimeService.onConnect(() => {
      console.log('Angular connected to Socket.IO');
    });

    this.realtimeService.onDisconnect((reason) => {
      console.log('Angular disconnected:', reason);
    });

    this.realtimeService.connect();
  }

  loadMatches(): void {
    this.isRefreshing.set(true);
    this.matchService.getMatches().subscribe({
      next: (response) => {
        this.matches.set(response.data);
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      },
      error: (error) => {
        console.error('Failed to load matches:', error);
        this.errorMessage.set('Failed to load matches from server.');
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      },
    });
  }

  setFilter(filter: FilterStatus): void {
    this.activeFilter.set(filter);
  }

  selectSportPreset(sport: string): void {
    this.matchForm.patchValue({ sport });
  }

  getSportIcon(sport: string): string {
    const s = sport.toLowerCase();
    if (s.includes('cricket')) return 'fa-solid fa-baseball-bat-ball';
    if (s.includes('football') || s.includes('soccer')) return 'fa-solid fa-futbol';
    if (s.includes('basket')) return 'fa-solid fa-basketball';
    if (s.includes('tennis')) return 'fa-solid fa-table-tennis-paddle-ball';
    if (s.includes('esport') || s.includes('gaming')) return 'fa-solid fa-gamepad';
    if (s.includes('racing') || s.includes('f1')) return 'fa-solid fa-flag-checkered';
    return 'fa-solid fa-trophy';
  }

  createMatch(): void {
    if (this.matchForm.invalid) {
      this.matchForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    const formValue = this.matchForm.getRawValue();

    this.matchService.createMatch(formValue).subscribe({
      next: () => {
        this.matchForm.reset({
          name: '',
          sport: '',
          status: 'UPCOMING',
          startTime: '',
          socketEnabled: true,
        });

        this.isSubmitting.set(false);
        this.loadMatches();
      },
      error: (error) => {
        console.error('Failed to create match:', error);
        this.errorMessage.set('Failed to create match. Please check inputs and try again.');
        this.isSubmitting.set(false);
      },
    });
  }
}