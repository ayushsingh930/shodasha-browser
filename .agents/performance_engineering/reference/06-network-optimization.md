# Network Optimization

## Why Network Optimization Matters

Network latency accounts for the majority of page load time. Optimizing how data travels from server to client is critical for performance.

```
Page Load Time Breakdown
┌──────────────────────────────────────────────┐
│ DNS Lookup │ TCP │ TLS │ Request │ Response  │
│ 20-120ms   │ ~   │ ~   │ ~       │ Varies    │
│            │     │     │         │           │
│ ←─────── Network Latency (60-80% of load) ──→│
└──────────────────────────────────────────────┘
```

## HTTP Protocol Evolution

```
HTTP/1.1 ──── HTTP/2 ──── HTTP/3 (QUIC)
  │            │              │
  │           Multiplex    UDP-based
Serial       Server Push  0-RTT
connections  Binary       Connection migration
Head-of-line  Header       Better loss handling
blocking     compression
```

### HTTP/2 Benefits
- Multiplexing: Multiple requests over single connection
- Header compression (HPACK): Reduces overhead
- Server push: Proactively send resources
- Binary protocol: More efficient parsing

### HTTP/3 Benefits
- Based on QUIC (UDP)
- 0-RTT connection setup
- No head-of-line blocking
- Better performance on poor networks

## CDN (Content Delivery Network)

```
                    ┌─────────────┐
                    │  Origin     │
                    │  Server     │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
    │ CDN     │      │ CDN     │      │ CDN     │
    │ Edge 1  │      │ Edge 2  │      │ Edge 3  │
    │ (US)    │      │ (EU)    │      │ (ASIA)  │
    └────┬────┘      └────┬────┘      └────┬────┘
         │                │                │
    ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
    │ User    │     │ User    │     │ User    │
    │ (NYC)   │     │ (London)│     │ (Tokyo) │
    └─────────┘     └─────────┘     └─────────┘
```

### CDN Benefits
- Reduced latency (serves from nearest edge)
- DDoS protection
- SSL termination
- Image optimization
- Cache offloading

## Compression

### Gzip / Brotli

```nginx
# Nginx — enable Brotli
brotli on;
brotli_types text/html text/css application/javascript;

# Nginx — enable Gzip (fallback)
gzip on;
gzip_types text/html text/css application/javascript;
gzip_comp_level 6;
gzip_min_length 256;
```

### Compression Comparison

| Algorithm | Compression Ratio | Speed | Browser Support |
|-----------|-----------------|-------|-----------------|
| Gzip | ~70% | Fast | Universal |
| Brotli | ~80% | Medium | 96%+ |
| Zstd | ~75% | Fast | Growing |

## Resource Hints

```html
<!-- DNS lookup in advance -->
<link rel="dns-prefetch" href="https://api.example.com" />

<!-- Preconnect (DNS + TCP + TLS) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />

<!-- Preload critical resources -->
<link rel="preload" as="image" href="hero.webp" />
<link rel="preload" as="font" href="font.woff2" crossorigin />

<!-- Prefetch for future navigation -->
<link rel="prefetch" as="document" href="/next-page" />

<!-- Prerender entire page -->
<link rel="prerender" href="/next-page" />
```

## Resource Hint Decision Flow

```
Is the resource needed for current page?
├── Yes → Is it critical for LCP/FCP?
│       ├── Yes → Preload
│       └── No → Include normally
└── No → Will it be needed soon?
        ├── Yes → Is the origin known?
        │       ├── Yes → Preconnect
        │       └── No → DNS-Prefetch
        └── No → Is it for next page?
                ├── Yes → Prefetch
                └── No → Don't hint
```

## Performance Targets

| Metric | Target | Technique |
|--------|--------|-----------|
| TTFB | < 800ms | CDN, server optimization |
| Time to First Paint | < 1.8s | Preload critical CSS |
| Page weight (total) | < 1MB | Compression, bundling |

## Recommended Setup

1. Enable HTTP/2 or HTTP/3 on your server
2. Use a CDN for static assets
3. Enable Brotli compression with Gzip fallback
4. Implement resource hints (preload, preconnect)
5. Minimize third-party scripts
6. Use connection pooling for APIs
7. Enable TCP fast open
