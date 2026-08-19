# Rendering Patterns

## Overview

Rendering patterns determine how and when your web application's UI is generated. Choosing the right pattern can dramatically impact performance, SEO, and user experience.

```
┌────────────────────────────────────────────────────────────┐
│                 Rendering Patterns Spectrum                  │
├──────────────┬──────────┬──────────┬──────────┬────────────┤
│     CSR      │   SSR    │   SSG    │   ISR    │ Streaming  │
│ (Client)     │ (Server) │ (Static) │ (Hybrid) │  (Progressive)│
│ Slow FCP     │ Fast FCP│ Fastest  │ Fast+Fresh│ Instant    │
│ Good TTI     │ Slow TTI│ Good TTI │ Good TTI │ Best UX    │
└──────────────┴──────────┴──────────┴──────────┴────────────┘
```

## CSR (Client-Side Rendering)

- **How it works**: Browser downloads HTML shell + JS bundle, renders everything client-side
- **Pros**: Rich interactivity, cheap hosting
- **Cons**: Slow initial load, poor SEO
- **Best for**: Dashboards, authenticated apps

## SSR (Server-Side Rendering)

- **How it works**: Server generates HTML per request, sends fully-rendered page
- **Pros**: Fast FCP, good SEO
- **Cons**: Slower TTI, higher server load
- **Best for**: Content sites, e-commerce

### SSR Flow

```
Client → Server Request
         ↓
    API Data Fetch
         ↓
    Render HTML
         ↓
Client ← Full HTML
         ↓
    Hydration (JS loads)
```

## SSG (Static Site Generation)

- **How it works**: HTML generated at build time, served statically via CDN
- **Pros**: Lightning fast, minimal server costs
- **Cons**: Stale content, rebuild required for changes
- **Best for**: Blogs, documentation, marketing sites

## ISR (Incremental Static Regeneration)

- **How it works**: Static pages with periodic background regeneration
- **Pros**: Fast + fresh content
- **Cons**: Complexity, stale-while-revalidate pattern
- **Best for**: E-commerce, news, large content sites

## Streaming SSR

- **How it works**: Server streams HTML in chunks as data becomes available
- **Pros**: Fastest TTFB, progressive rendering
- **Cons**: Browser support considerations
- **Best for**: Data-heavy pages, real-time apps

## Decision Flowchart

```
Is content dynamic?
├── No → Can it be pre-built?
│       ├── Yes → SSG
│       └── No → ISR
└── Yes → Need real-time data?
        ├── Yes → CSR or Streaming SSR
        └── No → SSR
```

## Performance Comparison

| Pattern | TTFB | FCP | LCP | TTI | SEO |
|---------|------|-----|-----|-----|-----|
| CSR | Fast | Slow | Slow | Good | Poor |
| SSR | Slow | Fast | Fast | Slow | Good |
| SSG | Fast | Fast | Fast | Fast | Good |
| ISR | Fast | Fast | Fast | Good | Good |
| Streaming | Fast | Fast | Fast | Good | Good |
