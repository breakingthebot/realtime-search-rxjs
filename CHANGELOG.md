# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semversioning.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-20

### Added
- Initialized Angular 21 Standalone project workspace.
- Setup `SearchService` mocking an asynchronous microservice database of 15 products.
- Configured simulated latency response delay (400ms) for search queries.
- Programmed input search stream debouncer using RxJS (`Subject`, `debounceTime`, `distinctUntilChanged`).
- Built slate dark-mode UI shell layout featuring animated search bars and status loaders.
- Added global keyboard shortcut listener focusing search inputs upon pressing `/`.
- Created robust unit test specs verifying debounced query streaming.

## [0.2.0] - 2026-07-20

### Added
- Created custom standalone `HighlightPipe` highlighting matching query sub-strings case-insensitively.
- Safe Html sanitization to bypass security warnings on custom marked highlights.
- Added visual styling class `.text-highlight` in `app.css` with transparent violet background colors.
- Added unit specs asserting regex sanitizations and case-insensitive matching tag insertions.

## [0.3.0] - 2026-07-20

### Added
- Integrated memory result cache (`Map`) inside `SearchService` to return pre-fetched queries instantly.
- Added inner stream `catchError` handlers inside the search `switchMap` pipeline.
- Built glowing error warning banner overlays with automated retry action selectors.
- Added header checkbox triggers to simulate microservice network timeouts.
- Wrote unit specs testing result caching speed improvements and stream recovery under timeouts.

## [0.4.0] - 2026-07-20

### Added
- Integrated dynamic filter tabs panel for category selections.
- Added dropdown selector with sorting options (Relevance, Price, and Ratings).
- Composed multiple streams (search inputs, category tabs, and sort selections) using RxJS `combineLatest`.
- Ensured category and sort selection changes filter instantly bypassing input typing debounces.
- Added unit specs asserting category filtering and price ascending/descending sorting orders.

## [0.5.0] - 2026-07-20

### Added
- Integrated LocalStorage-backed query search history tracker (up to 5 recent queries).
- Implemented suggestion dropdown list appearing underneath focused search input fields.
- Wrote `mousedown` focus preservation event handler overrides preventing blur/render race conditions.
- Added deletion routines for individual history queries and clear-all capabilities.
- Wrote unit specs testing history tracking records in LocalStorage and query deletions.

## [0.6.0] - 2026-07-20

### Added
- Integrated high-performance `IntersectionObserver` scroll sentinel at the bottom of the catalog.
- Added client-side paged list slicing (defaulting to 6 items per page chunk).
- Built visual loader animations and pulsing progress dots for page loads.
- Appended end-of-catalog status notifications once all items are paginated.
- Refactored test suites to verify paged list slices, Observer bypasses, and paged results loaders.

## [0.7.0] - 2026-07-20

### Added
- Upgraded single-category tab selector into multi-select checkbox filters.
- Added twin price range limit sliders (Min and Max) enforcing bounds.
- Structured side-by-side workspace grid containing the Filter Sidebar next to results columns.
- Programmed active filters check checks enabling clear queries resets.
- Added unit specs validating double-slider price restrictions and multi-category intersections.

## [0.8.0] - 2026-07-20

### Added
- Integrated dynamic performance telemetry tracker logging latency times.
- Exposed cached query detection utility method `hasCachedQuery` in `SearchService`.
- Built SVG micro-bar chart representing search times in the sidebar.
- Added visual indicators distinguishing cache hits (⚡ lightning, green bar) vs API requests (☁️ cloud, purple bar).
- Exposed global Math utilities inside component template scopes.
- Created unit tests verifying latency measurements and cache status logs.
