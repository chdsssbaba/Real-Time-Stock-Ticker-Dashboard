# Real-Time Stock Ticker Dashboard with React & TanStack Query

A high-performance, fault-tolerant real-time stock ticker dashboard built with React 19, TypeScript, Vite, and TanStack Query. Designed for FinTech scenarios where client resilience, deterministic API degradation handling, and accessible live updates are critical.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![TanStack_Query](https://img.shields.io/badge/TanStack%20Query-v5-ff4154.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Multi--Stage-2496ed.svg)

---

## Architecture & System Design

```
+-----------------------------------------------------------------------------------+
|                                  USER INTERFACE                                    |
|  +------------------+  +-------------------+  +--------------------------------+  |
|  |  Add Ticker Form |  | Circuit Status UI |  | Stock Cards Grid (AAPL, etc.)  |  |
|  | (500ms debounce) |  | (aria-live="poli")|  | Individual loading/error/chart |  |
|  +------------------+  +-------------------+  +--------------------------------+  |
+------------------------------------------^----------------------------------------+
                                           |
                                           | useQuery (refetchInterval: 10000ms)
+------------------------------------------v----------------------------------------+
|                          TANSTACK REACT QUERY CACHE                                |
|          Manages 10s auto-polling, deduplication, cache stale/gc times            |
+------------------------------------------^----------------------------------------+
                                           |
                                           | fetchStockData(symbol)
+------------------------------------------v----------------------------------------+
|                           RESILIENCE LAYER (CIRCUIT BREAKER)                      |
|                                                                                   |
|    +-------------------+    3 Failures      +-------------------+                 |
|    |      CLOSED       | -----------------> |       OPEN        |                 |
|    | (Requests allowed)|                    | (Immediate Fail)  |                 |
|    +-------------------+                    +-------------------+                 |
|              ^                                        |                           |
|              | Success                                | 30s Timeout               |
|              |                                        v                           |
|         +----+----------------------------------------+----+                      |
|         |                   HALF-OPEN                      |                      |
|         |          (1 trial request permitted)             |                      |
|         +--------------------------------------------------+                      |
|                                   | Failure                                       |
|                                   +----------------> Back to OPEN                 |
+------------------------------------------^----------------------------------------+
                                           |
                                           | HTTP GET
+------------------------------------------v----------------------------------------+
|                         EXTERNAL STOCK API / FALLBACK                             |
|          (Finnhub API / Alpha Vantage / Twelve Data / Intelligent Mock)           |
+-----------------------------------------------------------------------------------+
```

---

## Core Features & Requirements Fulfilled

1. **Default Tracked Tickers**: Initialized with 5 default stock tickers (`AAPL`, `GOOG`, `MSFT`, `AMZN`, `TSLA`).
2. **Comprehensive Metric Cards**: Displays formatted current price (`$150.00`), absolute daily change, and percentage change (`+1.25%`), with graceful `N/A` fallbacks.
3. **TanStack Query Polling**: Automated background refetch every 10 seconds (`refetchInterval: 10000`).
4. **Debounced Search**: Input field protected by a custom `debounce` utility delaying additions by 500ms of inactivity to prevent API thrashing.
5. **Interactive Controls**: Users can dynamically add new tickers or remove any existing card with the interactive removal control.
6. **Scoped Loading & Error States**: Card-level `isLoading` and `isError` isolation ensures a single ticker failure never interrupts other active tickers.
7. **Global Loading Skeleton & Host Unreachable Guard**: Initial load displays full-page skeleton loaders, and network disconnection displays a global offline banner.
8. **Client-Side Circuit Breaker**:
   - **CLOSED**: Requests pass through normally.
   - **OPEN**: Trips after 3 consecutive failures; immediately fails fast without firing network requests.
   - **HALF_OPEN**: Transitions automatically after 30 seconds to allow a single probe request.
9. **Accessible Live Status UI**: Screen-reader friendly with `aria-live="polite"` announcing circuit transitions and stock modifications.
10. **Interactive Trend Visualizations**: Responsive line/area charts embedded in each card dynamically adjusting to parent card dimensions.
11. **Keyboard Accessibility**: Full WCAG compliance with keyboard navigation (`Tab` / `Enter`) and high-visibility `:focus-visible` rings.
12. **Containerized Production Build**: Multi-stage `Dockerfile` with Node build stage and Nginx runtime stage, orchestrated via `docker-compose.yml`.

---

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm 9+
- Docker & Docker Compose (optional for containerized execution)

### 1. Clone & Install
```bash
git clone https://github.com/chdsssbaba/Real-Time-Stock-Ticker-Dashboard.git
cd Real-Time-Stock-Ticker-Dashboard
npm install
```

### 2. Environment Configuration
Copy the sample environment configuration:
```bash
cp .env.example .env
```

Configure your API credentials in `.env`:
```env
# The base URL for the stock API (Finnhub, Alpha Vantage, etc.)
VITE_STOCK_API_BASE_URL=https://finnhub.io/api/v1

# Your secret API key (free at https://finnhub.io)
VITE_STOCK_API_KEY=your_api_key_here
```
> **Note**: If no API key is specified, the application defaults to an intelligent simulated market feed with realistic price drift and volatility for demonstration and offline testing.

### 3. Development Server
Start the Vite development server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Running Unit Tests
Run the Vitest unit test suite covering the debounce utility and the circuit breaker state machine:
```bash
npm test
```

### 5. Production Build
Verify TypeScript types and build minified assets:
```bash
npm run build
npm run preview
```

---

## Docker & Containerization

The repository includes a multi-stage `Dockerfile` and `docker-compose.yml` that builds the application using Node and serves production assets via high-performance Nginx.

### Running with Docker Compose
```bash
# Build and run the containerized app mapped to host port 8080
docker-compose up --build
```
Access the application at `http://localhost:8080`.

To stop the containers:
```bash
docker-compose down
```

---

## Testing Strategy

The resilience patterns are deterministically validated via automated unit tests using Vitest fake timers (`vi.useFakeTimers()`):

- **Debounce Test (`tests/debounce.test.ts`)**:
  - Delays execution until exactly 500ms after the last invocation.
  - Resets the timer upon continuous typing.
  - Supports programmatic cancellation via `.cancel()`.

- **Circuit Breaker Test (`tests/circuitBreaker.test.ts`)**:
  - Validates requests pass through when in `CLOSED` state.
  - Transitions to `OPEN` after exactly 3 consecutive failures.
  - Enforces instant fast-fail when `OPEN` without invoking the underlying network function.
  - Transitions to `HALF_OPEN` after the 30,000ms cooldown window.
  - Closes on successful probe or immediately re-trips to `OPEN` on probe failure.

---

## Accessibility (a11y) & WCAG Compliance

- **ARIA Live Regions**: `aria-live="polite"` announces circuit breaker transitions and stock modifications to screen readers.
- **Focus Indicators**: High-contrast `outline: 2px solid #06b6d4` focus rings for all interactive buttons, inputs, and controls.
- **Semantic HTML**: Proper `<header>`, `<main>`, `<section>`, and `<button>` landmarks.
- **Color Contrast**: Complies with WCAG AA standard against dark background `#020617`.
