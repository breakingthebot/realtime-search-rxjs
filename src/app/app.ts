// src/app/app.ts
// Main application controller handling debounced RxJS query stream pipelines.
// Created: 2026-07-20

import { Component, signal, ViewChild, ElementRef, OnInit, OnDestroy, AfterViewInit, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { Subject, Subscription, of, combineLatest } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map } from 'rxjs/operators';
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
export class App implements OnInit, OnDestroy, AfterViewInit {
  public searchService = inject(SearchService);
  private querySubject = new Subject<string>();
  private searchSubscription?: Subscription;

  // Template element references
  @ViewChild('searchInput') searchInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('scrollSentinel') scrollSentinelRef!: ElementRef<HTMLDivElement>;

  // Signal states
  queryValue = signal<string>('');
  searchResults = signal<Product[]>([]);
  isLoading = signal<boolean>(false);
  hasError = signal<boolean>(false);

  // Filters & Sorting state signals
  activeCategory = signal<string>('All');
  activeSort = signal<string>('relevance');

  // Pagination states
  currentPage = signal<number>(1);
  pageSize = 6;
  hasMorePages = signal<boolean>(true);
  isLoadingNextPage = signal<boolean>(false);
  public allFilteredProducts: Product[] = [];

  // Convert signals to observables in component construction phase (valid injection context)
  private category$ = toObservable(this.activeCategory);
  private sort$ = toObservable(this.activeSort);

  // Focus tracking state
  isInputFocused = signal<boolean>(false);

  // Recent queries history state signal
  recentQueries = signal<string[]>([]);

  // List of available categories
  categories = ['All', 'Smartphones', 'Laptops', 'Audio', 'Tablets', 'Accessories', 'Monitors', 'Gaming'];

  // Scroll sentinel observer
  private observer?: IntersectionObserver;

  // Global keyboard shortcut focus listener
  @HostListener('window:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.key === '/' && document.activeElement !== this.searchInputRef?.nativeElement) {
      event.preventDefault();
      this.searchInputRef?.nativeElement?.focus();
    }
  }

  ngOnInit(): void {
    // Load recent queries from LocalStorage
    try {
      const saved = localStorage.getItem('recent_queries');
      if (saved) {
        this.recentQueries.set(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load search history:', e);
    }

    const query$ = this.querySubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    );

    // Combine queries, filters and sorting modes dynamically
    this.searchSubscription = combineLatest([query$, this.category$, this.sort$]).pipe(
      switchMap(([query, category, sort]) => {
        this.isLoading.set(true);
        this.hasError.set(false);
        
        return this.searchService.searchProducts(query).pipe(
          map(products => {
            // Apply category filter
            let results = products;
            if (category !== 'All') {
              results = products.filter(p => p.category === category);
            }

            // Apply sorting rules
            if (sort === 'price-low') {
              results = [...results].sort((a, b) => a.price - b.price);
            } else if (sort === 'price-high') {
              results = [...results].sort((a, b) => b.price - a.price);
            } else if (sort === 'rating-high') {
              results = [...results].sort((a, b) => b.rating - a.rating);
            }

            return results;
          }),
          catchError(err => {
            console.error('Inner Search Stream caught: ', err);
            this.hasError.set(true);
            this.isLoading.set(false);
            return of([]);
          })
        );
      })
    ).subscribe({
      next: (products) => {
        if (!this.hasError()) {
          // Initialize first paged chunk
          this.allFilteredProducts = products;
          this.currentPage.set(1);
          this.hasMorePages.set(this.allFilteredProducts.length > this.pageSize);
          this.searchResults.set(this.allFilteredProducts.slice(0, this.pageSize));
          
          // Append query value to recent searches if search succeeds
          const currentQuery = this.queryValue().trim();
          if (currentQuery) {
            this.addToHistory(currentQuery);
          }
        }
        this.isLoading.set(false);
      }
    });

    // Execute initial load of products database
    this.triggerSearch('');
  }

  ngAfterViewInit(): void {
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver(): void {
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }
    try {
      this.observer = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          this.loadNextPage();
        }
      }, { threshold: 0.1, rootMargin: '100px' });

      if (this.scrollSentinelRef?.nativeElement) {
        this.observer.observe(this.scrollSentinelRef.nativeElement);
      }
    } catch (e) {
      console.error('Failed to initialize scroll observer:', e);
    }
  }

  loadNextPage(): void {
    if (this.isLoading() || this.isLoadingNextPage() || !this.hasMorePages() || this.hasError()) {
      return;
    }

    this.isLoadingNextPage.set(true);
    // Simulate pagination microservices query delay
    setTimeout(() => {
      const nextPage = this.currentPage() + 1;
      const endIndex = nextPage * this.pageSize;
      const sliced = this.allFilteredProducts.slice(0, endIndex);

      this.searchResults.set(sliced);
      this.currentPage.set(nextPage);
      this.hasMorePages.set(this.allFilteredProducts.length > endIndex);
      this.isLoadingNextPage.set(false);
    }, 600);
  }

  onQueryChange(value: string): void {
    this.queryValue.set(value);
    this.querySubject.next(value);
  }

  triggerSearch(value: string): void {
    this.queryValue.set(value);
    this.querySubject.next(value);
  }

  setCategory(category: string): void {
    this.activeCategory.set(category);
  }

  clearSearch(): void {
    this.queryValue.set('');
    this.activeCategory.set('All');
    this.activeSort.set('relevance');
    this.querySubject.next('');
    this.searchInputRef?.nativeElement?.focus();
  }

  retrySearch(): void {
    this.querySubject.next(this.queryValue());
  }

  toggleSimulateError(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    this.searchService.simulateError.set(checkbox.checked);
    this.retrySearch();
  }

  // History Caching Helper Routines
  addToHistory(query: string): void {
    const trimmed = query.trim();
    if (!trimmed) return;

    const current = this.recentQueries();
    const filtered = current.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, 5);

    this.recentQueries.set(updated);
    try {
      localStorage.setItem('recent_queries', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  }

  selectRecentQuery(query: string, event: MouseEvent): void {
    event.preventDefault(); // Retains input focus
    this.triggerSearch(query);
  }

  removeRecentQuery(query: string, event: MouseEvent): void {
    event.preventDefault(); // Retains input focus
    event.stopPropagation(); // Prevents triggerSearch selection click callback

    const updated = this.recentQueries().filter(q => q !== query);
    this.recentQueries.set(updated);
    try {
      localStorage.setItem('recent_queries', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save search history:', e);
    }
  }

  clearHistory(event: MouseEvent): void {
    event.preventDefault(); // Retains input focus
    this.recentQueries.set([]);
    try {
      localStorage.removeItem('recent_queries');
    } catch (e) {
      console.error('Failed to clear search history:', e);
    }
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.observer?.disconnect();
  }
}
