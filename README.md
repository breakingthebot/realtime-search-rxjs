# InstantCatalog — RxJS Real-Time Search Engine

A premium, responsive search catalog application leveraging Angular 21, reactive signals, and RxJS pipelines to query mock databases with simulated microservice latency.

## Stack
- **Framework**: Angular 21 (Standalone architecture, Signals reactive status management)
- **Streams Management**: RxJS 7 (Subject pipelines, debounceTime, distinctUntilChanged)
- **Testing Runner**: Vitest (fakeAsync/promises specifications)
- **Styling**: Vanilla CSS (Global theme variables)

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables
Refer to `.env.example`.
- `PORT`: Development server target port (default `4200`)

## Running Locally
Run the Angular development server:
```bash
npm run start
```
Open `http://localhost:4200` to interact with the search panel.

## Deployed
Live Link: **[https://realtime-search-rxjs.vercel.app](https://realtime-search-rxjs.vercel.app)**

## Architecture Notes
To prevent excessive API load and race conditions during typing, this search engine uses an RxJS stream pipeline. Keystrokes are sent to a `Subject` that debounces values for `300ms` and filters duplicate consecutive values. The stream will support auto-cancellation of pending HTTP requests during typing updates.

## Data Handling
No database is attached to this application. All catalog data is processed in-memory and queried via mock services. Settings or query states are retained inside browser LocalStorage.
