// src/app/app.ts
// Main application controller handling debounced RxJS query stream pipelines.
// Created: 2026-07-20

import { Component, signal, ViewChild, ElementRef, OnInit, OnDestroy, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { SearchService } from './services/search';
import { Product } from './models/product';

import { HighlightPipe } from './utils/highlight.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HighlightPipe],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  private searchService = inject(SearchService);
  private querySubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Template element reference
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;

  // Signal states
  queryValue = signal<string>('');
  searchResults = signal<Product[]>([]);
  isLoading = signal<boolean>(false);

  // Focus tracking state
  isInputFocused = signal<boolean>(false);

  // Global window listener: press '/' to focus the search bar input
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.key === '/' && document.activeElement !== this.searchInputRef?.nativeElement) {
      event.preventDefault();
      this.searchInputRef?.nativeElement?.focus();
    }
  }

  ngOnInit(): void {
    // Pipe input stream with 300ms debounce filter
    this.searchSubscription = this.querySubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        this.isLoading.set(true);
        return this.searchService.searchProducts(query);
      })
    ).subscribe({
      next: (products) => {
        this.searchResults.set(products);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Search Stream error: ', err);
        this.isLoading.set(false);
      }
    });

    // Execute initial load of products database
    this.triggerSearch('');
  }

  onQueryChange(value: string): void {
    this.queryValue.set(value);
    this.querySubject.next(value);
  }

  triggerSearch(value: string): void {
    this.queryValue.set(value);
    this.querySubject.next(value);
  }

  clearSearch(): void {
    this.queryValue.set('');
    this.querySubject.next('');
    this.searchInputRef?.nativeElement?.focus();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }
}
