# Monitoring & Profiling

## Why Monitoring Matters

You can't improve what you don't measure. Continuous monitoring reveals performance regressions, bottlenecks, and usage patterns.

```
Performance Monitoring Stack
┌──────────────────────────────────────────┐
│         Real User Monitoring (RUM)        │
│   (Web Vitals, Page Load, Interactions)  │
├──────────────────────────────────────────┤
│         Synthetic Monitoring             │
│   (Lighthouse CI, Playwright, Puppeteer) │
├──────────────────────────────────────────┤
│           APM (Backend)                  │
│   (Datadog, New Relic, OpenTelemetry)    │
├──────────────────────────────────────────┤
│        Infrastructure Monitoring         │
│   (CPU, Memory, Disk, Network, Logs)     │
└──────────────────────────────────────────┘
```

## Types of Monitoring

### 1. Lab Data (Synthetic)

Controlled environment testing with consistent results.

| Tool | What It Measures | How to Run |
|------|-----------------|------------|
| Lighthouse | Performance, A11y, SEO, Best Practices | `npx lighthouse https://example.com` |
| WebPageTest | Detailed waterfall, filmstrip | webpagetest.org |
| Playwright | Custom performance scenarios | `npx playwright test` |
| k6 | Load testing | `k6 run script.js` |

### 2. Field Data (RUM)

Real user data from actual browsers — represents true user experience.

```javascript
// Collect and send Web Vitals
import { onLCP, onFID, onCLS, onINP, onTTFB } from 'web-vitals';

function sendToAnalytics({ name, value, rating, delta, id }) {
  const body = {
    name,           // 'LCP' | 'FID' | 'CLS' | 'INP' | 'TTFB'
    value,          // Raw value (ms or score)
    rating,         // 'good' | 'needs-improvement' | 'poor'
    delta,          // Change from previous
    id,             // Unique metric ID
    url: location.pathname,
    userAgent: navigator.userAgent,
    deviceMemory: navigator.deviceMemory,
    connection: navigator.connection?.effectiveType,
  };

  navigator.sendBeacon('/api/vitals', JSON.stringify(body));
}

onLCP(sendToAnalytics);
onFID(sendToAnalytics);
onCLS(sendToAnalytics);
onINP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

## Lighthouse CI

```yaml
# lighthouserc.json — Automate performance budgets
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "staticDistDir": "./dist",
      "url": ["/", "/about", "/product"]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["warn", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

## Backend APM Setup (OpenTelemetry)

```javascript
// Node.js OpenTelemetry setup
const { NodeTracerProvider } = require('@opentelemetry/node');
const { SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');

const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({ endpoint: 'http://localhost:14268/api/traces' });

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();

// Trace will automatically instrument HTTP, DB calls, etc.
```

## Profiling Tools

### CPU Profiling

```bash
# Built-in Node.js profiler
node --prof app.js
# Process results
node --prof-process isolate-*.log > processed.txt

# Clinic.js — Flame graphs
npx clinic doctor -- node app.js
npx clinic flame -- node app.js
```

### Memory Profiling

```bash
# Heap dump
node --heapsnapshot-signal=SIGUSR2 app.js
# Then open in Chrome DevTools > Memory > Load

# Using clinic.js
npx clinic heapprofiler -- node app.js
```

## Performance Budgets

| Metric | Good | Needs Work | Poor |
|--------|------|------------|------|
| LCP | < 2.5s | 2.5-4.0s | > 4.0s |
| FID/INP | < 100ms | 100-300ms | > 300ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| TTFB | < 800ms | 800-1800ms | > 1800ms |
| FCP | < 1.8s | 1.8-3.0s | > 3.0s |
| TBT | < 200ms | 200-600ms | > 600ms |
| Bundle size | < 200KB | 200-500KB | > 500KB |

## Alerting Strategy

```
Alert Severity Levels
┌─────────────────────────────────────────────────┐
│ CRITICAL (PagerDuty, Slack @channel)             │
│ LCP > 4.5s for 5+ minutes                        │
│ Error rate > 5%                                  │
│ Site completely down                             │
├─────────────────────────────────────────────────┤
│ WARNING (Slack notification)                     │
│ LCP > 3.5s for 15+ minutes                       │
│ Bundle size exceeds budget by 20%                │
│ API p95 > 2000ms                                 │
├─────────────────────────────────────────────────┤
│ INFO (Weekly report)                             │
│ Performance regression > 5% week-over-week       │
│ New dependencies added over budget               │
│ Lighthouse score dropped by 3+ points            │
└─────────────────────────────────────────────────┘
```

## Recommended Setup

1. Add RUM monitoring with web-vitals library
2. Set up Lighthouse CI in CI/CD pipeline
3. Configure APM for backend (OpenTelemetry + Jaeger/Datadog)
4. Create performance dashboards (Grafana, DataDog)
5. Define performance budgets and alert on violations
6. Profile CPU and memory regularly
7. Run load tests before major releases
