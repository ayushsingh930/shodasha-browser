# Node.js Performance Engineering

## Understanding Node.js Architecture

Node.js is single-threaded, event-driven, and non-blocking. Understanding this architecture is key to writing performant code.

```
Node.js Runtime Architecture
┌──────────────────────────────────────────┐
│              Node.js Process              │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │         V8 JavaScript Engine        │  │
│  │  (Compiles JS → Machine Code)       │  │
│  └────────────────────────────────────┘  │
│                    │                      │
│  ┌────────────────────────────────────┐  │
│  │         Event Loop                 │  │
│  │  ┌─────────┐  ┌─────────┐         │  │
│  │  │ timers  │  │ pending │         │  │
│  │  ├─────────┤  ├─────────┤         │  │
│  │  │ poll    │  │ check   │         │  │
│  │  └─────────┘  └─────────┘         │  │
│  └────────────────────────────────────┘  │
│                    │                      │
│  ┌────────────────────────────────────┐  │
│  │      Worker Thread Pool (libuv)    │  │
│  │  (4 threads by default)            │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

## The Event Loop

The event loop is Node.js's mechanism for handling asynchronous operations. Understanding it prevents blocking.

```
Event Loop Phases
┌─────────────────────────────────────────────────────────┐
│   timers → pending → idle → poll → check → close        │
│   (setTimeout,   (callbacks)  (I/O)   (setImmediate)     │
│    setInterval)                                          │
└─────────────────────────────────────────────────────────┘
```

### What Blocks the Event Loop?
- Synchronous CPU-heavy operations
- JSON.parse/stringify on large objects
- Complex regex operations
- Large array manipulations
- Cryptography operations

## Key Performance Patterns

### 1. Async/Await Over Sync

```javascript
// ❌ BAD: Blocks the event loop
const data = fs.readFileSync('large-file.json');

// ✅ GOOD: Non-blocking
const data = await fs.promises.readFile('large-file.json');
```

### 2. Parallel Execution

```javascript
// ❌ BAD: Sequential (100ms + 100ms + 100ms = 300ms)
const user = await getUser(id);
const posts = await getPosts(id);
const notifications = await getNotifications(id);

// ✅ GOOD: Parallel (100ms total)
const [user, posts, notifications] = await Promise.all([
  getUser(id),
  getPosts(id),
  getNotifications(id)
]);
```

### 3. Clustering for Multi-Core

```javascript
const cluster = require('cluster');
const http = require('http');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  // Fork workers for each CPU
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork(); // Restart
  });
} else {
  // Worker process — share the same port
  http.createServer((req, res) => {
    res.writeHead(200);
    res.end('Hello World\n');
  }).listen(8000);

  console.log(`Worker ${process.pid} started`);
}
```

### 4. Gzip Compression

```javascript
const compression = require('compression');
const express = require('express');
const app = express();

// Compress all responses
app.use(compression({
  level: 6,        // Balance speed vs compression (1-9)
  threshold: 256,  // Min size in bytes to compress
}));
```

### 5. Connection Pooling (Database)

```javascript
// Use connection pooling instead of creating new connections
const { Pool } = require('pg');
const pool = new Pool({
  max: 20,           // Max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Reuse pool instead of creating new connection
async function query(text, params) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
```

## Memory Management

### Common Memory Leaks
1. Global variables that never get cleared
2. Closures holding references to large objects
3. Event listeners that are never removed
4. Cached data without TTL
5. Large object allocations without cleanup

### Monitoring Heap

```bash
# Take heap snapshot
node --heapsnapshot-signal=SIGUSR2 app.js

# Monitor garbage collection
node --trace-gc app.js

# Use clinic.js for heap analysis
npx clinic heapprofiler -- node app.js
```

## Production Checklist

| Area | Check | Tool |
|------|-------|------|
| Process management | Use PM2 with cluster mode | PM2 |
| Error handling | Global error handler + logging | Winston/Sentry |
| Memory | Monitor heap, set max-old-space-size | `--max-old-space-size=4096` |
| Security | Helmet, rate limiting, CORS | express-rate-limit |
| Monitoring | CPU, memory, event loop lag | PM2, Datadog |
| Logging | Structured, async logging | Pino/Winston |
| Environment | NODE_ENV=production, --enable-source-maps | — |

## Fast Path / Slow Path Architecture

```
Request → Is it a simple read?
          ├── Yes → Fast Path
          │        Cache lookup → Return
          └── No → Slow Path
                   Validations → DB Query → Enrich → Return
```

## Recommended Setup

1. Always use async/await, never blocking sync calls
2. Use Promise.all() for parallel independent operations
3. Enable cluster mode for multi-core machines
4. Implement connection pooling for databases
5. Use Redis for caching frequently accessed data
6. Set memory limits and monitor for leaks
7. Use PM2 for process management and auto-restart
8. Load test before production with autocannon or wrk
