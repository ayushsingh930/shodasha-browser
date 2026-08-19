> Source: [Landing Page Examples](https://www.figma.com/resource-library/landing-page-examples/) · [Pricing Page Best Practices](https://www.figma.com/resource-library/pricing-page-best-practices/)

# Landing & Page Design for Premium Web Design

## Quick Reference

| Element | Specification |
|---------|--------------|
| Hero headline | **2.5-4.5rem** (clamp fluid) |
| CTA button | **48px+ height**, high contrast color |
| Max nav items | **5-7** |
| Pricing tiers | **3-4** (decoy middle tier) |
| FAQ items | **5 max** (buying decisions only) |
| Section padding desktop | **5rem** (80px) |
| Section padding mobile | **2rem** (32px) |
| Content max-width | **1200px** (wide), 720px (text) |
| Hero CTA count | **2 max** (primary + secondary) |

## Landing Page Best Practices

### The Core Formula
1. **Simple navigation** — minimize or remove top-level nav, focus on single outcome
2. **Compelling CTA** — contrasting color + action-oriented language, above the fold
3. **Trust signals** — security badges, testimonials, logos, ratings, privacy links
4. **Match intent** — align copy with the ad/link that brought users in
5. **Clear visual hierarchy** — headline and CTA must be most visually dominant
6. **Social proof near CTAs** — place strongest proof where doubt is highest
7. **Benefit-driven language** — "Manages over 10,000 customers" not "10 GB of storage"

### Premium Landing Page Structure
```
┌─────────────────────────────────────┐
│  Header (logo + nav + CTA)         │
├─────────────────────────────────────┤
│  Hero                               │
│  Headline (benefit-focused)         │
│  Subheadline (supporting)           │
│  [Primary CTA] [Secondary]          │
│  (optional: hero image/demo)        │
├─────────────────────────────────────┤
│  Social proof (logos, stats)        │
├─────────────────────────────────────┤
│  Features (3-column grid or list)   │
│  - Feature icon + title + desc      │
├─────────────────────────────────────┤
│  How it works (3-step visual)       │
├─────────────────────────────────────┤
│  Testimonials / Case studies        │
├─────────────────────────────────────┤
│  Pricing (3-4 tiers)                │
├─────────────────────────────────────┤
│  FAQ (5 questions max)              │
├─────────────────────────────────────┤
│  Final CTA section                  │
│  "Ready to get started?"            │
│  [Primary CTA]                      │
├─────────────────────────────────────┤
│  Footer (minimal)                   │
└─────────────────────────────────────┘
```

### Complete HTML Skeleton
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="Landing page description" />
  <title>Product Name - Value Proposition</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preload" href="/fonts/inter.woff2" as="font" crossorigin />
</head>
<body>
  <a href="#main" class="skip-link">Skip to main content</a>

  <header class="site-header">
    <div class="container header-inner">
      <a href="/" class="logo" aria-label="Home"><!-- SVG logo --></a>
      <nav aria-label="Main" class="nav-links">
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
      </nav>
      <a href="#cta" class="btn btn-primary">Get Started</a>
      <button class="menu-toggle" aria-label="Menu" aria-expanded="false">☰</button>
    </div>
  </header>

  <main id="main">
    <section class="hero">
      <div class="container hero-inner">
        <h1>Headline: <span class="highlight">Benefit-Driven</span></h1>
        <p class="hero-subtitle">Supporting subheadline that clarifies value.</p>
        <div class="hero-actions">
          <a href="#cta" class="btn btn-primary btn-lg">Get Started Free</a>
          <a href="#demo" class="btn btn-secondary">Watch Demo</a>
        </div>
      </div>
    </section>

    <section class="social-proof" aria-label="Trusted by">
      <div class="container">
        <!-- Client logos -->
      </div>
    </section>

    <section id="features" class="features">
      <div class="container">
        <h2>Everything you need</h2>
        <div class="feature-grid">
          <article class="feature-card">
            <div class="feature-icon"><!-- SVG --></div>
            <h3>Feature Name</h3>
            <p>Feature description with benefit.</p>
          </article>
          <!-- Repeat 3-6x -->
        </div>
      </div>
    </section>

    <section id="pricing" class="pricing">
      <div class="container">
        <h2>Simple, transparent pricing</h2>
        <div class="pricing-grid">
          <!-- 3-4 pricing cards -->
        </div>
      </div>
    </section>

    <section id="faq" class="faq">
      <div class="container">
        <h2>Frequently asked questions</h2>
        <details><!-- 5 items max --></details>
      </div>
    </section>

    <section class="cta-final">
      <div class="container">
        <h2>Ready to get started?</h2>
        <p>Join 10,000+ happy customers.</p>
        <a href="#cta" class="btn btn-primary btn-lg">Start Free Trial</a>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="container footer-inner">
      <p>&copy; 2026 Company. All rights reserved.</p>
      <!-- Minimal links: Privacy, Terms -->
    </div>
  </footer>
</body>
</html>
```

## Hero Section Design

```css
.hero {
  min-height: 80vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 6rem 0 4rem;
}

.hero-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero h1 {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.03em;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: clamp(1.125rem, 2vw, 1.375rem);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 540px;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .hero-inner {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }
  .hero-subtitle {
    margin-inline: auto;
  }
  .hero-actions {
    justify-content: center;
  }
}
```

## Feature Section with 3-Column Grid

```css
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  padding: 2rem;
  border-radius: 16px;
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border-default);
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.08);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}
```

## Social Proof Section

```css
.social-proof {
  padding: 3rem 0;
  text-align: center;
}

.social-proof p {
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-secondary);
  margin-bottom: 1.5rem;
}

.client-logos {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 3rem;
  flex-wrap: wrap;
  opacity: 0.6;
}

.client-logo {
  height: 24px;
  filter: grayscale(100%);
  transition: filter 200ms ease;
}

.client-logo:hover {
  filter: grayscale(0%);
}
```

## Testimonial Section

```css
.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.testimonial-card {
  padding: 2rem;
  border-radius: 16px;
  background: var(--color-bg-secondary);
  position: relative;
}

.testimonial-card::before {
  content: '"';
  font-size: 4rem;
  line-height: 1;
  color: var(--color-action-primary);
  opacity: 0.2;
  position: absolute;
  top: 0.5rem;
  left: 1rem;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
}
```

## FAQ Section with Details/Summary

```css
.faq-list {
  max-width: 720px;
  margin: 0 auto;
}

.faq-item {
  border-bottom: 1px solid var(--color-border-default);
  padding: 1rem 0;
}

.faq-item summary {
  font-weight: 600;
  cursor: pointer;
  padding: 0.5rem 0;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.faq-item summary::after {
  content: '+';
  font-size: 1.25rem;
  transition: transform 200ms ease;
}

.faq-item[open] summary::after {
  content: '−';
}

.faq-item .faq-answer {
  padding: 0.5rem 0 1rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
}
```

## Pricing Page Design

### Key Metrics to Measure
- **Bounce rate** — visitors who leave without clicking
- **Time on page** — low = scanning/leaving; high = hunting for info
- **Conversion rate** — % who click CTA

Use GA4 for tracking. Ongoing A/B testing and optimization.

### Pricing Page Layout (Top to Bottom)
1. Value-focused headline
2. Short subheading (clarifies audience)
3. Plan descriptions (1 sentence each)
4. Pricing cards (3-4 tiers, lowest to highest)
5. "Recommended" badge on middle tier (decoy effect)
6. Trust badges & social proof near CTAs
7. Comparison table (grouped features)
8. FAQ section (~5 questions on buying decisions)
9. Sticky CTA (visible while scrolling)

### Pricing Grid CSS
```css
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  align-items: center;
}

.pricing-card {
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-primary);
  display: flex;
  flex-direction: column;
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.pricing-card.featured {
  border-color: var(--color-action-primary);
  box-shadow: 0 8px 32px rgba(79,70,229,0.12);
  transform: scale(1.03);
}

.pricing-card .price {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  line-height: 1;
  margin: 0.5rem 0;
}

.pricing-card .price-period {
  font-size: 1rem;
  font-weight: 400;
  color: var(--color-text-secondary);
}

.pricing-features {
  list-style: none;
  padding: 0;
  margin: 1.5rem 0;
  flex: 1;
}

.pricing-features li {
  padding: 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.pricing-features li::before {
  content: '✓';
  color: var(--color-success);
  font-weight: 700;
}

.badge-recommended {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--color-action-primary);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}
```

### The 9 Rules
1. **Keep it simple** — plain language, clear hierarchy, features → benefits
2. **Limit to 3-4 tiers** — prevents analysis paralysis. Name: Essentials/Advanced/Pro/Max
3. **Be transparent** — no hidden fees, whole numbers, monthly/annual toggle showing savings
4. **Show social proof** — testimonials near CTAs, recognizable logos, case studies
5. **Comparison table** — break down what each plan includes, group features into labeled sections
6. **Tooltips on advanced features** — click/tap (not hover-only for mobile)
7. **Optimize for mobile** — stack cards, accordion features, sticky CTAs
8. **Include FAQ** — ~5 questions addressing buying decisions, not SEO filler
9. **Strong CTAs** — high-contrast, large, sticky. Copy varies by tier

### The Decoy Effect
Place a Basic and Premium plan around a middle tier. The middle becomes "most rational."
Add **"Most Popular" badge** with contrasting color on one plan.

### Benefit-Driven Language
| Instead of (Feature) | Say (Benefit) |
|---|---|
| 10 GB of storage | Manages over 10,000 customers |
| Advanced dashboard | Spot trends in your customer data |
| API platform | Built-in third-party integrations |
| 24/7 support | We're here when you need us |

## Portfolio Page Design

### Premium portfolio structure
1. **Hero** — name, title, one-liner value prop, CTA to work/contact
2. **Featured work** — 3-4 best projects with case study thumbnails
3. **Process/approach** — how they work (2-3 steps)
4. **Testimonials** — client quotes
5. **Contact / CTA** — "Let's work together"

### Portfolio grid patterns
- Masonry layout for varied content
- 2-column grid for case studies
- Large hero project + smaller grid below

## Page typography hierarchy
```
H1 — Page title (hero): 2.5-4.5rem, bold, distinctive
H2 — Section heading: 1.75-2.5rem
H3 — Subsection heading: 1.25-1.5rem
Body — Content: 1rem-1.125rem
Small — Captions, metadata: 0.75-0.875rem
```

## Cross-References
- See [layout-spacing.md](./layout-spacing.md) for section spacing and grid patterns
- See [ui-components.md](./ui-components.md) for button, card, and form patterns
- See [typography.md](./typography.md) for heading/body sizing
- See [interaction-design.md](./interaction-design.md) for scroll reveals and micro-interactions
- See [responsive-design.md](./responsive-design.md) for mobile landing page adaptation
- See [design-tokens.md](./design-tokens.md) for consistent spacing and color tokens
