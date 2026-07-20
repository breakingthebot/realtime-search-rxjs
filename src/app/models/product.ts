// src/app/models/product.ts
// Product schema definition for database queries and search results.
// Created: 2026-07-20

export interface Product {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  thumbnail: string;
}
