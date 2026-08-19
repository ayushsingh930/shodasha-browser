# Code Splitting & Bundling

## What Is Code Splitting?

Code splitting is the practice of breaking your application's JavaScript bundle into smaller chunks that can be loaded on-demand rather than all at once.

### Why It Matters

```
Without Code Splitting:
[   Single Large Bundle (500KB)   ]
Loaded at once → Blocks main thread → Slow TTI

With Code Splitting:
[  Core (50KB)  ] ← Loaded immediately
[  Route A (80KB) ] ← Loaded on navigation
[  Route B (60KB) ] ← Loaded on navigation
[  Vendor (150KB) ] ← Cached separately
```

## Code Splitting Techniques

### 1. Route-Level Splitting

Split your app at the route level so each page only loads its own code.

```javascript
// Instead of: import Dashboard from './Dashboard';
// Do this:
const Dashboard = React.lazy(() => import('./Dashboard'));

// With React Router
<Routes>
  <Route
    path="/dashboard"
    element={
      <Suspense fallback={<Loading />}>
        <Dashboard />
      </Suspense>
    }
  />
</Routes>
```

### 2. Component-Level Splitting

Split heavy components that are not immediately visible.

```javascript
const HeavyChart = React.lazy(() => import('./HeavyChart'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);
  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<div>Loading chart...</div>}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

### 3. Vendor Splitting

Separate third-party libraries that change infrequently (React, lodash, etc.) into a vendor chunk for better caching.

## Tree Shaking

Tree shaking is the process of removing unused code from your final bundle.

```javascript
// Bad: Imports entire library
import { debounce } from 'lodash';

// Good: Imports only what's needed
import debounce from 'lodash/debounce';
```

### How Tree Shaking Works

```
Source Code → Parse AST → Mark Used Exports → Remove Unused
     │            │              │                   │
     │            │              │                   │
  All code    Analyze      Keep used           Dead code
  imported    imports      exports              eliminated
```

### Requirements for Tree Shaking
- ES Module syntax (`import`/`export`) — CommonJS won't work
- Side-effect-free packages
- Production mode build

## Bundle Analysis

### Tools

| Tool | Purpose | Command |
|------|---------|---------|
| Webpack Bundle Analyzer | Visualize bundle contents | `npx webpack-bundle-analyzer stats.json` |
| vite-bundle-visualizer | Vite bundle analysis | `npx vite-bundle-visualizer` |
| source-map-explorer | Source map analysis | `npx source-map-explorer bundle.js` |
| BundlePhobia | Check package cost | `npx bundle-phobia-cli package-name` |

### Setting Up Bundle Analysis

```javascript
// webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      reportFilename: 'bundle-report.html'
    })
  ]
};
```

## Bundle Size Budgets

Set budgets to prevent bundle bloat:

```javascript
// webpack.config.js
module.exports = {
  performance: {
    maxAssetSize: 244000,     // 244 KB per asset
    maxEntrypointSize: 400000, // 400 KB per entry
    hints: 'error'            // Fail build if exceeded
  }
};
```

## Dynamic Imports Under the Hood

```
┌─────────────────────────────────────────┐
│        How Dynamic Import Works          │
├─────────────────────────────────────────┤
│ import('module')                         │
│         ↓                                │
│ Creates a separate chunk (chunk.js)     │
│         ↓                                │
│ Creates a <script> tag dynamically      │
│         ↓                                │
│ Browser fetches the chunk               │
│         ↓                                │
│ Module executes when loaded             │
└─────────────────────────────────────────┘
```

## Recommended Strategy

1. Start with route-level splitting (biggest gain)
2. Add component-level splitting for heavy components
3. Configure vendor chunk splitting
4. Set bundle size budgets
5. Analyze with Bundle Analyzer regularly
6. Audit dependencies quarterly
