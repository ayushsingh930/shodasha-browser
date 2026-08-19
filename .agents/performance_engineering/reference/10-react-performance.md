# React Performance Optimization

## React's Rendering Behavior

React re-renders a component when its state, props, or parent component changes. Unnecessary re-renders are the most common performance issue.

```
React Rendering Flow
State/Props Change
      ↓
Component Re-renders
      ↓
Creates New Virtual DOM (VNode)
      ↓
Diff Against Previous VDOM
      ↓
Commit DOM Updates (if changed)
```

## Key Optimization Techniques

### 1. React.memo

Prevents re-rendering when props haven't changed (shallow comparison).

```javascript
// Without memo: Re-renders every time parent re-renders
const ExpensiveList = ({ items }) => {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
};

// With memo: Only re-renders if items reference changes
const ExpensiveList = React.memo(({ items }) => {
  return items.map(item => <ExpensiveItem key={item.id} item={item} />);
});
```

### 2. useMemo

Memoizes expensive computations.

```javascript
// ❌ BAD: Recomputes on every render
function Dashboard({ transactions, filter }) {
  const filtered = transactions
    .filter(t => t.type === filter)
    .sort((a, b) => b.amount - a.amount)
    .reduce((acc, t) => acc + t.amount, 0);

  return <div>Total: {filtered}</div>;
}

// ✅ GOOD: Only recomputes when dependencies change
function Dashboard({ transactions, filter }) {
  const filtered = useMemo(() => {
    return transactions
      .filter(t => t.type === filter)
      .sort((a, b) => b.amount - a.amount)
      .reduce((acc, t) => acc + t.amount, 0);
  }, [transactions, filter]);

  return <div>Total: {filtered}</div>;
}
```

### 3. useCallback

Memoizes function references to prevent child re-renders.

```javascript
// Without useCallback: New function every render → child re-renders
function Parent() {
  const handleClick = () => { /* ... */ };
  return <Child onClick={handleClick} />;
}

// With useCallback: Stable reference
function Parent() {
  const handleClick = useCallback(() => {
    // ...
  }, []); // Dependencies

  return <Child onClick={handleClick} />;
}
```

### 4. Virtualization (Windowing)

Only render visible items in long lists.

```javascript
import { FixedSizeList } from 'react-window';

function VirtualList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {items[index].name}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### Performance Gain from Virtualization

```
Without Virtualization (10,000 items):
DOM Nodes: 10,000
Render Time: 200ms
Memory: ~50MB

With Virtualization (react-window, 20 visible):
DOM Nodes: ~30 (20 visible + buffer)
Render Time: 5ms
Memory: ~2MB
```

### 5. Suspense & Lazy Loading

```javascript
import { Suspense, lazy } from 'react';

// Heavy component loaded only when needed
const ProductGallery = lazy(() => import('./ProductGallery'));

function ProductPage() {
  return (
    <Suspense fallback={<GallerySkeleton />}>
      <ProductGallery />
    </Suspense>
  );
}
```

### 6. Key Prop Best Practices

```javascript
// ❌ BAD: Using index as key (causes re-renders + bugs)
{items.map((item, index) => <Item key={index} item={item} />)}

// ✅ GOOD: Using unique ID
{items.map(item => <Item key={item.id} item={item} />)}
```

## React DevTools Profiler

```
React DevTools Profiler
┌──────────────────────────────────────────┐
│  Flamegraph View                         │
│                                          │
│  App ──────────────────────────────────  │
│  ├── Header ─── (0.3ms)                 │
│  ├── Sidebar ── (0.2ms)                 │
│  └── Content ───────────────────────    │
│       ├── ProductList ── (12ms) ← Slow  │
│       │   ├── ProductCard (2ms each)     │
│       └── Footer ──── (0.1ms)           │
└──────────────────────────────────────────┘
```

## Common React Performance Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Unnecessary re-renders | Components render when unrelated state changes | React.memo, useMemo, useCallback |
| Large lists | Slow rendering, laggy scrolling | Virtualization (react-window) |
| Large bundle | Slow initial load | Code splitting + lazy loading |
| Inline functions | Child re-renders on every render | useCallback |
| Expensive computations | Laggy UI on state change | useMemo |
| State in wrong place | Too many re-renders up the tree | Lift state down, Context splitting |
| Context overuse | All consumers re-render | Split context, useMemo for value |

## Performance Checklist

- [ ] Use React.memo for pure components
- [ ] Memoize expensive computations with useMemo
- [ ] Stabilize function references with useCallback
- [ ] Virtualize long lists (>100 items)
- [ ] Lazy load routes and heavy components
- [ ] Use production build (no PropTypes in prod)
- [ ] Avoid index as key
- [ ] Profile with React DevTools
- [ ] Split context values to avoid mass re-renders
- [ ] Use a bundler with tree shaking
