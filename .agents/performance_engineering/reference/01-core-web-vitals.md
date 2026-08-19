# Core Web Vitals & Performance Metrics

## What Are Core Web Vitals?

Core Web Vitals are Google's set of real-world, user-centered metrics that quantify the user experience on the web. They measure loading performance, interactivity, and visual stability.

### The Three Core Metrics

```
┌─────────────────────────────────────────────────────────┐
│                    Core Web Vitals                        │
├──────────────┬──────────────┬────────────────────────────┤
│   LCP        │    FID       │     CLS                    │
│  (Loading)   │ (Interactivity) │ (Visual Stability)      │
│  Target:     │  Target:     │  Target:                   │
│  < 2.5s      │  < 100ms    │  < 0.1                     │
└──────────────┴──────────────┴────────────────────────────┘
```

### LCP (Largest Contentful Paint)
- Measures loading performance — when the largest content element becomes visible
- **Good**: < 2.5s | **Needs Improvement**: 2.5s - 4.0s | **Poor**: > 4.0s
- **Optimization**:
  - Optimize server response time (TTFB)
  - Preload hero images and key resources
  - Use a CDN
  - Minimize render-blocking resources

### FID (First Input Delay) / INP (Interaction to Next Paint)
- Measures interactivity — time from first user interaction to browser response
- **Good**: < 100ms | **Needs Improvement**: 100ms - 300ms | **Poor**: > 300ms
- **Optimization**:
  - Break up long JavaScript tasks
  - Use web workers for heavy computation
  - Defer non-critical JavaScript
  - Minimize main thread work

### CLS (Cumulative Layout Shift)
- Measures visual stability — unexpected layout shifts during page load
- **Good**: < 0.1 | **Needs Improvement**: 0.1 - 0.25 | **Poor**: > 0.25
- **Optimization**:
  - Set explicit width/height on images and embeds
  - Reserve space for dynamic content (ads, embeds)
  - Use `aspect-ratio` CSS property
  - Avoid inserting content above existing content

## Secondary Metrics

| Metric | What It Measures | Target |
|--------|-----------------|--------|
| TTFB (Time to First Byte) | Server response time | < 800ms |
| FCP (First Contentful Paint) | First visual render | < 1.8s |
| TBT (Total Blocking Time) | Main thread blocking | < 200ms |
| SI (Speed Index) | Visual completeness | < 3.4s |

## Measurement Tools

```
                    Performance Measurement Tools
                    │
        ┌───────────┼───────────┐
        │           │           │
    Lighthouse   Web Vitals  RUM Data
    (Lab Data)   Extension   (Field Data)
        │           │           │
        └───────────┼───────────┘
                    │
            Performance Score
```

## Implementing Web Vitals in Code

```javascript
// Using the web-vitals library
import { onLCP, onFID, onCLS, onINP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  const body = JSON.stringify(metric);
  navigator.sendBeacon('/analytics', body);
}

onLCP(sendToAnalytics);
onFID(sendToAnalytics);
onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

## RAIL Model

Google's RAIL model defines performance goals based on user perception:

| Phase | Goal | User Expectation |
|-------|------|-----------------|
| Response | < 50ms | Instant feedback on interaction |
| Animation | < 10ms per frame | Smooth 60fps animations |
| Idle | < 50ms | Background processing |
| Load | < 3s (mobile) | Page is usable quickly |
