// src/app/app.spec.ts
// Unit specs asserting RxJS search streams and search service queries.
// Created: 2026-07-20

import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { App } from './app';
import { SearchService } from './services/search';

describe('InstantCatalog Application Search Systems', () => {
  let searchService: SearchService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [SearchService]
    }).compileComponents();

    searchService = TestBed.inject(SearchService);
  });

  it('should initialize the App component shell', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should fetch complete list of mock products when search query is empty', async () => {
    const products = await firstValueFrom(searchService.searchProducts(''));
    expect(products.length).toBe(15);
  });

  it('should filter mock products case-insensitively by query keyword matching', async () => {
    const products = await firstValueFrom(searchService.searchProducts('iphone'));
    expect(products.length).toBe(1);
    expect(products[0].title).toBe('iPhone 15 Pro');
  });

  it('should debounce input queries and trigger search only after typing pause', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    // Wait for initial catalog loading to resolve (300ms debounce + 400ms delay)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Act: simulate keyboard typing sequence
    app.onQueryChange('d');
    app.onQueryChange('de');
    app.onQueryChange('dell');

    // Assert: search results are not immediately loaded (waiting for debounce)
    expect(app.isLoading()).toBe(false);

    // Wait for debounce time (300ms) + simulated latency (400ms)
    await new Promise(resolve => setTimeout(resolve, 800));

    expect(app.isLoading()).toBe(false);
    expect(app.searchResults().length).toBe(1);
    expect(app.searchResults()[0].title).toBe('Dell XPS 15');
  });

  it('should clear queries and focus search input successfully', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 800)); // Clear init load

    app.queryValue.set('ipad');
    app.clearSearch();

    expect(app.queryValue()).toBe('');
    
    // Wait for debounce + delay
    await new Promise(resolve => setTimeout(resolve, 800));
    expect(app.searchResults().length).toBe(15);
  });
});
