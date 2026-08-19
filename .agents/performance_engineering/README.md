# Performance Engineering Skill

A comprehensive guide to Full-Stack Performance Engineering covering Frontend (React, JS, CSS, Core Web Vitals, Build Tools) and Backend (Node.js, Event Loop, Caching, Database) optimization techniques.

## Scale Overview

This skill contains **10 reference modules** covering the complete performance engineering lifecycle.

### Reference Modules

| # | Module | Focus Area | Difficulty |
|---|--------|------------|------------|
| 1 | [Core Web Vitals](./reference/01-core-web-vitals.md) | LCP, FID, CLS, INP, TTFB | Beginner |
| 2 | [Rendering Patterns](./reference/02-rendering-patterns.md) | CSR, SSR, SSG, ISR, Streaming | Intermediate |
| 3 | [Code Splitting & Bundling](./reference/03-code-splitting-bundling.md) | Dynamic imports, Tree shaking, Bundle analysis | Intermediate |
| 4 | [Image Optimization](./reference/04-image-optimization.md) | Lazy loading, Responsive images, WebP/AVIF | Beginner |
| 5 | [Caching Strategies](./reference/05-caching-strategies.md) | HTTP cache, Service Worker, CDN, Redis | Intermediate |
| 6 | [Network Optimization](./reference/06-network-optimization.md) | HTTP/2, HTTP/3, CDN, Compression, Prefetch | Intermediate |
| 7 | [Build Tool Optimization](./reference/07-build-tool-optimization.md) | Webpack, Vite, Turbopack, esbuild, SWC | Advanced |
| 8 | [Node.js Performance](./reference/08-nodejs-performance.md) | Event loop, Clustering, Profiling, Async | Advanced |
| 9 | [Monitoring & Profiling](./reference/09-monitoring-profiling.md) | Lighthouse, RUM, APM, Error tracking | Intermediate |
| 10 | [React Performance](./reference/10-react-performance.md) | Memoization, Virtualization, Suspense, Profiler | Intermediate |

### How to Use This Skill

1. **New to performance?** Start with Module 1 (Core Web Vitals) and Module 4 (Image Optimization)
2. **Building a React app?** Focus on Modules 2, 3, 10
3. **Working on Node.js backend?** Focus on Modules 5, 6, 8
4. **Going to production?** Read Modules 7 and 9

### Quick Audit Checklist

- [ ] Lighthouse score >= 90 on all pages
- [ ] LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Images served in WebP/AVIF format
- [ ] Code splitting implemented at route level
- [ ] Production build with minification + tree shaking
- [ ] HTTP caching headers configured
- [ ] CDN enabled for static assets
- [ ] Node.js clustering enabled
- [ ] Memory leak monitoring active
- [ ] Bundle size budgets configured
