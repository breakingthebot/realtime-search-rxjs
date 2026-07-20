// src/app/services/search.ts
// Handles mock product database queries, result caching, and error injections.
// Created: 2026-07-20

import { Injectable, signal } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { delay, switchMap, tap } from 'rxjs/operators';
import { Product } from '../models/product';

const MOCK_PRODUCTS: Product[] = [
  { id: '1', title: 'iPhone 15 Pro', description: 'Apple iPhone 15 Pro, titanium design, A17 Pro chip', category: 'Smartphones', price: 999, rating: 4.8, thumbnail: '📱' },
  { id: '2', title: 'Samsung Galaxy S24 Ultra', description: 'Samsung Galaxy S24 Ultra, AI camera, Snapdragon 8 Gen 3', category: 'Smartphones', price: 1199, rating: 4.7, thumbnail: '📱' },
  { id: '3', title: 'MacBook Pro 16', description: 'Apple MacBook Pro 16-inch, M3 Max chip, 32GB RAM', category: 'Laptops', price: 2499, rating: 4.9, thumbnail: '💻' },
  { id: '4', title: 'Dell XPS 15', description: 'Dell XPS 15 laptop, Intel Core i9, RTX 4060 graphics', category: 'Laptops', price: 1899, rating: 4.5, thumbnail: '💻' },
  { id: '5', title: 'Sony WH-1000XM5', description: 'Sony wireless noise-cancelling headphones, black design', category: 'Audio', price: 349, rating: 4.6, thumbnail: '🎧' },
  { id: '6', title: 'AirPods Pro 2', description: 'Apple AirPods Pro 2nd Gen, active noise cancellation', category: 'Audio', price: 249, rating: 4.8, thumbnail: '🎧' },
  { id: '7', title: 'iPad Pro 12.9', description: 'Apple iPad Pro 12.9-inch, M2 chip, Liquid Retina XDR', category: 'Tablets', price: 1099, rating: 4.7, thumbnail: '📱' },
  { id: '8', title: 'Kindle Paperwhite', description: 'Amazon Kindle Paperwhite e-reader, 6.8-inch display', category: 'Tablets', price: 139, rating: 4.6, thumbnail: '📖' },
  { id: '9', title: 'Logitech MX Master 3S', description: 'Logitech ergonomic wireless mouse, quiet clicks, grey design', category: 'Accessories', price: 99, rating: 4.8, thumbnail: '🖱️' },
  { id: '10', title: 'Keychron K2 V2', description: 'Keychron wireless mechanical keyboard, Gateron brown switches', category: 'Accessories', price: 79, rating: 4.5, thumbnail: '⌨️' },
  { id: '11', title: 'LG UltraFine 32', description: 'LG 32-inch 4K UHD monitor, IPS panel, USB-C power delivery', category: 'Monitors', price: 499, rating: 4.4, thumbnail: '🖥️' },
  { id: '12', title: 'Asus ROG Swift', description: 'Asus ROG gaming monitor, 360Hz refresh rate, Fast IPS', category: 'Monitors', price: 699, rating: 4.7, thumbnail: '🖥️' },
  { id: '13', title: 'Nintendo Switch OLED', description: 'Nintendo Switch OLED console, white Joy-Con controller grips', category: 'Gaming', price: 349, rating: 4.8, thumbnail: '🎮' },
  { id: '14', title: 'Sony PlayStation 5', description: 'Sony PlayStation 5 Slim console, digital edition, SSD storage', category: 'Gaming', price: 449, rating: 4.9, thumbnail: '🎮' },
  { id: '15', title: 'Bose QuietComfort Ultra', description: 'Bose over-ear headphones, noise cancelling, immersive audio', category: 'Audio', price: 429, rating: 4.6, thumbnail: '🎧' }
];

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  // In-memory query cache map
  private cache = new Map<string, Product[]>();

  // Signal to trigger simulated server error
  simulateError = signal<boolean>(false);

  searchProducts(query: string): Observable<Product[]> {
    const trimmed = query.trim().toLowerCase();

    // If simulated error is enabled, return delayed throwError
    if (this.simulateError()) {
      return timer(400).pipe(
        switchMap(() => throwError(() => new Error('Microservice Gateway Timeout (Simulated Error)')))
      );
    }

    // Check if query exists in cache (return instantly)
    if (this.cache.has(trimmed)) {
      return of(this.cache.get(trimmed)!);
    }

    if (!trimmed) {
      return of(MOCK_PRODUCTS).pipe(
        delay(400),
        tap(products => this.cache.set(trimmed, products))
      );
    }

    const filtered = MOCK_PRODUCTS.filter(product => {
      return (
        product.title.toLowerCase().includes(trimmed) ||
        product.description.toLowerCase().includes(trimmed) ||
        product.category.toLowerCase().includes(trimmed)
      );
    });

    return of(filtered).pipe(
      delay(400),
      tap(products => this.cache.set(trimmed, products))
    );
  }

  // Utility to clear query cache
  clearCache(): void {
    this.cache.clear();
  }
}
