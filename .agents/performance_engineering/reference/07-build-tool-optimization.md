# Build Tool Optimization

## Overview

Modern build tools are the foundation of frontend performance. They transform, bundle, and optimize your code before it reaches the browser.

```
Build Pipeline Evolution
2015 ──── 2018 ──── 2021 ──── 2024+
Webpack  Webpack 4  Vite 2    Vite 5
Grunt    Parcel     esbuild    Turbopack
Gulp     Rollup     Snowpack   Rspack
         └── Slow ──→ └── Fast (Rust/Go based)
```

## Build Tool Comparison

| Tool | Language | Speed | Bundle Output | Config |
|------|----------|-------|---------------|--------|
| Webpack 5 | JS | Slow | Optimized | Complex |
| Vite 5 | JS/Rollup | Fast | Optimized | Simple |
| esbuild | Go | Very Fast | Basic | Minimal |
| Turbopack | Rust | Very Fast | Optimized | Simple |
| Rspack | Rust | Very Fast | Optimized | Webpack-compatible |
| Parcel 2 | JS/Rust | Fast | Optimized | Zero-config |

## Webpack Optimization

### Production Config

```javascript
// webpack.prod.js
module.exports = {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: { drop_console: true },
        },
      }),
      new CssMinimizerPlugin(),
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  output: {
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].chunk.js',
  },
};
```

### Webpack Performance Tips

1. Use `thread-loader` for CPU-intensive loaders
2. Enable persistent caching with `cache: { type: 'filesystem' }`
3. Use `include`/`exclude` in loaders to reduce file scope
4. Use `IgnorePlugin` to skip unnecessary modules
5. Prefer `DllPlugin` for stable vendor bundles (legacy)

## Vite Optimization

```javascript
// vite.config.js
export default defineConfig({
  build: {
    target: 'es2020',
    minify: 'esbuild',       // or 'terser' for better compression
    cssMinify: 'lightningcss',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['antd', '@ant-design/icons'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  experimental: {
    renderBuiltUrl(filename) {
      return `https://cdn.example.com/${filename}`;
    },
  },
});
```

### Vite Performance Features
- Native ES Module dev server (no bundling in dev)
- esbuild for transpilation (10-100x faster than Babel)
- Optimized dependencies pre-bundling
- CSS code splitting
- Automatic chunk splitting

## Module Bundling Flow

```
Source Files → Parse → Resolve Imports → Transform
                                          ↓
                                  ┌───────────────┐
                                  │ Module Graph   │
                                  │ (dependency    │
                                  │  tree)         │
                                  └───────────────┘
                                          ↓
                                  Tree Shaking
                                          ↓
                                  Chunk Grouping
                                          ↓
                                  Minification
                                          ↓
                                  Content Hashing
                                          ↓
                                  Output Files
```

## Optimized Build Checklist

| Optimization | Webpack | Vite | Impact |
|-------------|---------|------|--------|
| Tree shaking | ✅ Built-in | ✅ Built-in | -30% size |
| Minification | TerserPlugin | esbuild | -40% size |
| CSS minification | CssMinimizerPlugin | lightningcss | -20% CSS |
| Code splitting | splitChunks | manualChunks | -50% initial |
| Content hash | [contenthash] | [hash] | Better caching |
| Dead code elimination | Built-in | Built-in | Varies |
| Bundle analysis | BundleAnalyzer | bundle-visualizer | Identifies issues |

## CI/CD Build Optimization

```yaml
# GitHub Actions — optimized build
jobs:
  build:
    steps:
      - uses: actions/cache@v4
        with:
          path: |
            node_modules
            .cache
            dist
          key: ${{ runner.os }}-build-${{ hashFiles('**/pnpm-lock.yaml') }}

      - run: pnpm install --frozen-lockfile
      - run: npm run build
```

## Recommended Strategy

1. Start with Vite (simpler, fast) or optimize Webpack config
2. Always tree-shake and minify in production
3. Implement code splitting at route level
4. Use content hashing for long-term caching
5. Analyze bundle regularly
6. Set build performance budgets
7. Cache node_modules and build cache in CI
