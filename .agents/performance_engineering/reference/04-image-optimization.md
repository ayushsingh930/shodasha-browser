# Image Optimization

## Why Image Optimization Matters

Images account for ~50% of a typical webpage's weight. Optimizing them is the single highest-impact performance improvement you can make.

```
Page Weight Breakdown (Typical Page)
┌────────────────────────────────────────┐
│ ████████████████████░░  Images (50%)   │
│ ██████░░░░░░░░░░░░░░  JS (25%)        │
│ ████░░░░░░░░░░░░░░░░  CSS (10%)       │
│ ██░░░░░░░░░░░░░░░░░░  Fonts (8%)      │
│ ██░░░░░░░░░░░░░░░░░░  HTML (7%)       │
└────────────────────────────────────────┘
```

## Image Optimization Techniques

### 1. Modern Formats

| Format | Compression | Browser Support | Use Case |
|--------|-------------|-----------------|----------|
| JPEG | Good | Universal | Photos |
| PNG | Lossless | Universal | Icons, transparency |
| WebP | 25-35% better than JPEG | 96% | Modern replacement |
| AVIF | 50% better than JPEG | 80%+ | Best compression |
| SVG | Scalable | Universal | Icons, logos |

### 2. Responsive Images

Serve different sizes based on viewport:

```html
<img
  src="photo-800.jpg"
  srcset="
    photo-400.jpg 400w,
    photo-800.jpg 800w,
    photo-1200.jpg 1200w
  "
  sizes="(max-width: 600px) 100vw, 50vw"
  alt="Description"
/>
```

### 3. Lazy Loading

```html
<!-- Native lazy loading (browser-level) -->
<img src="photo.jpg" loading="lazy" alt="Description" />

<!-- Intersection Observer for custom control -->
<iframe loading="lazy" src="widget.html"></iframe>
```

### 4. Image CDN

Use an image CDN that handles:
- Automatic format selection (AVIF → WebP → JPEG)
- Resizing and cropping
- Compression optimization
- CDN delivery

```html
<!-- Before: Direct file -->
<img src="/images/photo.jpg" />

<!-- After: Image CDN -->
<img src="https://cdn.example.com/f:auto/q:80/w:800/photo.jpg" />
```

## Image Optimization Pipeline

```
Upload Original
      ↓
   Image CDN / Build Pipeline
      ↓
┌──────────────────────────────┐
│  Generate Multiple Formats   │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐│
│  │AVIF│ │WebP│ │JPEG│ │PNG ││
│  └────┘ └────┘ └────┘ └────┘│
│  Generate Multiple Sizes     │
│  400w  800w  1200w  2000w    │
└──────────────────────────────┘
      ↓
   <picture> Element Selects Best
      ↓
   Browser Renders Optimally
```

### Using the `<picture>` Element

```html
<picture>
  <source srcset="photo.avif" type="image/avif" />
  <source srcset="photo.webp" type="image/webp" />
  <img src="photo.jpg" alt="Description" loading="lazy" />
</picture>
```

## CSS vs Image Sprites

```
Without Sprites:
[icon1.png] [icon2.png] [icon3.png] → 3 HTTP Requests

With Sprites:
[sprite.png] → 1 HTTP Request
  ├── icon1 (offset)
  ├── icon2 (offset)
  └── icon3 (offset)
```

## Performance Targets

| Metric | Target | Technique |
|--------|--------|-----------|
| Image weight per page | < 500KB | Compression, modern formats |
| Largest Contentful Paint | < 2.5s | Preload hero image |
| Offscreen images load | Not until visible | Lazy loading |

## Recommended Setup

1. Use next-gen formats (AVIF/WebP)
2. Implement responsive images with srcset
3. Enable lazy loading (native + Intersection Observer fallback)
4. Use an image CDN
5. Set explicit width/height to prevent CLS
6. Optimize above-the-fold images aggressively
7. Use `preload` for hero images: `<link rel="preload" as="image" href="hero.webp" />`
