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
