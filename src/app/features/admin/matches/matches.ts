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

  // Global Settings Modal state
  readonly isGlobalModalOpen = signal<boolean>(false);
  readonly globalSettings = signal<{
    updateInterval: number;
    dataType: 'SCORE' | 'FULL' | 'STATISTICS';
    binary: boolean;
    compression: boolean;
    socketEnabled: boolean;
  }>({
    updateInterval: 3000,
    dataType: 'SCORE',
    binary: true,
    compression: true,
    socketEnabled: true,
  });

  // Socket Settings Modal state
  readonly selectedSettingsMatch = signal<Match | null>(null);
  readonly selectedSettings = signal<{
    useGlobalDefaults: boolean;
    updateInterval: number;
    dataType: 'SCORE' | 'FULL' | 'STATISTICS';
    binary: boolean;
    compression: boolean;
    socketEnabled: boolean;
  }>({
    useGlobalDefaults: true,
    updateInterval: 3000,
    dataType: 'SCORE',
    binary: true,
    compression: true,
    socketEnabled: true,
  });
  readonly isLoadingSettings = signal<boolean>(false);
  readonly isSavingSettings = signal<boolean>(false);
  readonly settingsSuccessMessage = signal<string>('');

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

  openGlobalModal(): void {
    this.isGlobalModalOpen.set(true);
    this.isLoadingSettings.set(true);
    this.settingsSuccessMessage.set('');

    this.matchService.getGlobalSettings().subscribe({
      next: (settings) => {
        this.globalSettings.set({
          updateInterval: settings.updateInterval ?? 3000,
          dataType: settings.dataType ?? 'SCORE',
          binary: settings.binary ?? true,
          compression: settings.compression ?? true,
          socketEnabled: settings.socketEnabled ?? true,
        });
        this.isLoadingSettings.set(false);
      },
      error: () => {
        this.isLoadingSettings.set(false);
      },
    });
  }

  closeGlobalModal(): void {
    this.isGlobalModalOpen.set(false);
  }

  updateGlobalSettingField<K extends keyof ReturnType<typeof this.globalSettings>>(field: K, value: ReturnType<typeof this.globalSettings>[K]): void {
    this.globalSettings.update((curr) => ({ ...curr, [field]: value }));
  }

  saveGlobalSettings(): void {
    this.isSavingSettings.set(true);
    this.settingsSuccessMessage.set('');

    this.matchService.updateGlobalSettings(this.globalSettings()).subscribe({
      next: () => {
        this.isSavingSettings.set(false);
        this.settingsSuccessMessage.set('Global socket defaults updated & broadcasted!');
        setTimeout(() => {
          this.closeGlobalModal();
          this.loadMatches();
        }, 1200);
      },
      error: (err) => {
        console.error('Failed to save global settings:', err);
        this.isSavingSettings.set(false);
      },
    });
  }

  openSettingsModal(match: Match): void {
    this.selectedSettingsMatch.set(match);
    this.isLoadingSettings.set(true);
    this.settingsSuccessMessage.set('');

    this.matchService.getMatchSettings(match._id).subscribe({
      next: (settings) => {
        this.selectedSettings.set({
          useGlobalDefaults: settings.useGlobalDefaults ?? true,
          updateInterval: settings.updateInterval ?? 3000,
          dataType: settings.dataType ?? 'SCORE',
          binary: settings.binary ?? true,
          compression: settings.compression ?? true,
          socketEnabled: settings.socketEnabled ?? match.socketEnabled,
        });
        this.isLoadingSettings.set(false);
      },
      error: () => {
        this.selectedSettings.set({
          useGlobalDefaults: true,
          updateInterval: 3000,
          dataType: 'SCORE',
          binary: true,
          compression: true,
          socketEnabled: match.socketEnabled,
        });
        this.isLoadingSettings.set(false);
      },
    });
  }

  closeSettingsModal(): void {
    this.selectedSettingsMatch.set(null);
  }

  updateSettingField<K extends keyof ReturnType<typeof this.selectedSettings>>(field: K, value: ReturnType<typeof this.selectedSettings>[K]): void {
    this.selectedSettings.update((curr) => ({ ...curr, [field]: value }));
  }

  saveSettings(): void {
    const match = this.selectedSettingsMatch();
    if (!match) return;

    this.isSavingSettings.set(true);
    this.settingsSuccessMessage.set('');

    const payload = this.selectedSettings();

    this.matchService.updateMatchSettings(match._id, payload).subscribe({
      next: () => {
        this.isSavingSettings.set(false);
        this.settingsSuccessMessage.set('Fixture settings updated & broadcasted via Redis!');
        setTimeout(() => {
          this.closeSettingsModal();
          this.loadMatches();
        }, 1200);
      },
      error: (err) => {
        console.error('Failed to update settings:', err);
        this.isSavingSettings.set(false);
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