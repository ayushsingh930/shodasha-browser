# Caching Strategies

## Why Caching Matters

Caching stores frequently accessed data in fast-access layers, reducing the need to recompute or refetch from slower sources. It's the single most effective performance optimization.

```
Caching Hierarchy (Speed vs Cost)
│
Fast      │  L1: CPU Cache (ns) — Expensive
          │  L2: Memory Cache (μs) — RAM / Redis
          │  L3: Disk Cache (ms) — SSD / HDD
Slow      │  L4: Network Cache (s) — CDN / Server
          │  L5: Origin Server — Full computation
```

## Types of Caching

### 1. Browser Cache (HTTP Caching)

```http
# Strong caching — never re-request
Cache-Control: public, max-age=31536000, immutable

# Conditional caching — check with server
Cache-Control: no-cache
ETag: "abc123"
Last-Modified: Wed, 21 Oct 2025 07:28:00 GMT
```

### 2. Service Worker Cache

```javascript
// Service Worker — cache-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cached) => cached || fetch(event.request))
  );
});
```

### 3. CDN Caching

```
User → CDN Edge (cache hit → serve)
         ↓ (cache miss)
      Origin Server → Response → CDN caches it
```

### 4. Application Cache (Redis / Memcached)

```javascript
const redis = require('redis');
const client = redis.createClient();

async function getUser(id) {
  // Try cache first
  const cached = await client.get(`user:${id}`);
  if (cached) return JSON.parse(cached);

  // Fallback to database
  const user = await db.findUser(id);

  // Cache for 1 hour
  await client.setEx(`user:${id}`, 3600, JSON.stringify(user));
  return user;
}
```

## Caching Strategies for APIs

```
Request → ┌─────────────┐
          │ Check Cache  │ ← Cache Hit → Return Immediately
          └──────┬───────┘
                 │ Cache Miss
          ┌──────┴───────┐
          │ Fetch from DB│
          └──────┬───────┘
          ┌──────┴───────┐
          │ Store in Cache│
          └──────┬───────┘
          ┌──────┴───────┐
          │ Return Response│
          └──────────────┘
```

### Cache Invalidation Strategies

| Strategy | How It Works | Use Case |
|----------|-------------|----------|
| TTL-based | Expire after time | Stale data is acceptable |
| Write-through | Update cache on write | Strong consistency |
| Write-behind | Async cache update | High write throughput |
| Cache-aside | App manages cache | Flexible control |

## Cache Headers Quick Reference

| Header | Meaning | Example |
|--------|---------|---------|
| `max-age` | Seconds to cache | `max-age=3600` |
| `s-maxage` | Shared cache (CDN) override | `s-maxage=86400` |
| `no-cache` | Revalidate before serving | — |
| `no-store` | Never cache | — |
| `must-revalidate` | Must check origin after expiry | — |
| `immutable` | Never revalidate during max-age | — |
| `stale-while-revalidate` | Serve stale while fetching fresh | `stale-while-revalidate=86400` |

## Cache Hit Ratio Optimization

```
Cache Hit Ratio = Cache Hits / (Cache Hits + Cache Misses)

Target:
  - Static assets: > 95%
  - API responses: > 80%
  - Database queries: > 90%

Improvement techniques:
  - Increase TTL where acceptable
  - Cache at more granular keys
  - Warm cache on deploy
  - Use predictive prefetching
```

## Recommended Cache Setup

1. **Static assets**: `max-age=31536000, immutable` with content hashing
2. **HTML pages**: `no-cache` with ETag for freshness
3. **API responses**: `max-age=60, stale-while-revalidate=86400`
4. **User data**: Redis with 1-hour TTL
5. **Database queries**: Query-level cache with write-through
