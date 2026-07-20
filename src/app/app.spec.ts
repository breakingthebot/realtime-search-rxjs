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
    expect(app.searchResults().length).toBe(6);
    expect(app.allFilteredProducts.length).toBe(15);
  });

  it('should cache search results and return them instantly on second query', async () => {
    searchService.clearCache();
    
    const startTime = Date.now();
    const products1 = await firstValueFrom(searchService.searchProducts('ipad'));
    const duration1 = Date.now() - startTime;
    expect(products1.length).toBe(1);
    expect(duration1).toBeGreaterThanOrEqual(390);

    const startTime2 = Date.now();
    const products2 = await firstValueFrom(searchService.searchProducts('ipad'));
    const duration2 = Date.now() - startTime2;
    expect(products2.length).toBe(1);
    expect(duration2).toBeLessThan(50);
  });

  it('should handle API timeouts resiliently using catchError boundary and let streams recover', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 800));

    searchService.simulateError.set(true);
    app.onQueryChange('kindle');

    await new Promise(resolve => setTimeout(resolve, 850));

    expect(app.hasError()).toBe(true);

    searchService.simulateError.set(false);
    app.onQueryChange('kindle paper');

    await new Promise(resolve => setTimeout(resolve, 850));

    expect(app.hasError()).toBe(false);
    expect(app.searchResults().length).toBe(1);
    expect(app.searchResults()[0].title).toBe('Kindle Paperwhite');
  });

  it('should filter search results by active category tab', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 800));

    app.toggleCategory('Smartphones');
    await new Promise(resolve => setTimeout(resolve, 450)); 
    
    expect(app.searchResults().length).toBe(2);
    expect(app.searchResults()[0].category).toBe('Smartphones');
  });

  it('should sort search results by price low-to-high ascending', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 800));

    app.activeSort.set('price-low');
    await new Promise(resolve => setTimeout(resolve, 450));

    const results = app.allFilteredProducts;
    expect(results.length).toBe(15);
    expect(results[0].price).toBe(79);
    expect(results[14].price).toBe(2499);
  });

  it('should sort search results by price high-to-low descending', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 800));

    app.activeSort.set('price-high');
    await new Promise(resolve => setTimeout(resolve, 450));

    const results = app.allFilteredProducts;
    expect(results.length).toBe(15);
    expect(results[0].price).toBe(2499);
    expect(results[14].price).toBe(79);
  });

  it('should track queries in LocalStorage search history list on success', async () => {
    localStorage.clear();
    
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 800));

    app.onQueryChange('keyboard');
    await new Promise(resolve => setTimeout(resolve, 850));

    expect(app.recentQueries()).toContain('keyboard');
    
    const stored = JSON.parse(localStorage.getItem('recent_queries') || '[]');
    expect(stored).toContain('keyboard');
  });

  it('should remove items from recent queries list', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    app.recentQueries.set(['mouse', 'headphones']);
    const mockEvent = {
      preventDefault: () => {},
      stopPropagation: () => {}
    } as MouseEvent;

    app.removeRecentQuery('mouse', mockEvent);
    expect(app.recentQueries()).toEqual(['headphones']);
    expect(JSON.parse(localStorage.getItem('recent_queries') || '[]')).toEqual(['headphones']);
  });

  it('should clear entire search history list', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    app.recentQueries.set(['mouse', 'headphones']);
    const mockEvent = {
      preventDefault: () => {}
    } as MouseEvent;

    app.clearHistory(mockEvent);
    expect(app.recentQueries()).toEqual([]);
    expect(localStorage.getItem('recent_queries')).toBeNull();
  });

  it('should slice query results into initial pages of 6 items', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 800));

    expect(app.searchResults().length).toBe(6);
    expect(app.hasMorePages()).toBe(true);
  });

  it('should load subsequent page chunks upon triggering loadNextPage', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 800));

    app.loadNextPage();
    await new Promise(resolve => setTimeout(resolve, 800));

    expect(app.searchResults().length).toBe(12);
    expect(app.currentPage()).toBe(2);
    expect(app.hasMorePages()).toBe(true);

    app.loadNextPage();
    await new Promise(resolve => setTimeout(resolve, 800));

    expect(app.searchResults().length).toBe(15);
    expect(app.hasMorePages()).toBe(false);
  });

  it('should filter search results by min and max price limits', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 800));

    app.minPrice.set(500);
    app.maxPrice.set(1000);
    await new Promise(resolve => setTimeout(resolve, 450));

    const results = app.allFilteredProducts;
    expect(results.length).toBeGreaterThan(0);
    results.forEach(product => {
      expect(product.price).toBeGreaterThanOrEqual(500);
      expect(product.price).toBeLessThanOrEqual(1000);
    });
  });

  it('should filter search results by multiple selected categories simultaneously', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    await new Promise(resolve => setTimeout(resolve, 800));

    app.toggleCategory('Smartphones');
    app.toggleCategory('Laptops');
    await new Promise(resolve => setTimeout(resolve, 450));

    const results = app.allFilteredProducts;
    expect(results.length).toBe(4); // 2 smartphones + 2 laptops
    results.forEach(product => {
      expect(['Smartphones', 'Laptops']).toContain(product.category);
    });
  });
});

import { HighlightPipe } from './utils/highlight.pipe';

describe('HighlightPipe Text Formatting', () => {
  let pipe: HighlightPipe;

  beforeEach(() => {
    TestBed.runInInjectionContext(() => {
      pipe = new HighlightPipe();
    });
  });

  it('should return original value if search query is empty', () => {
    const result = pipe.transform('iPhone 15 Pro', '');
    expect(result).toBe('iPhone 15 Pro');
  });

  it('should wrap matching characters in mark tags case-insensitively', () => {
    const result = pipe.transform('iPhone 15 Pro', 'pro') as any;
    const htmlString = result.changingThisBreaksApplicationSecurity;
    expect(htmlString).toContain('<mark class="text-highlight">Pro</mark>');
  });

  it('should escape special regex symbols correctly without crashing', () => {
    const result = pipe.transform('Target+Plus', 't+') as any;
    const htmlString = result.changingThisBreaksApplicationSecurity;
    expect(htmlString).toContain('<mark class="text-highlight">t+</mark>');
  });
});
