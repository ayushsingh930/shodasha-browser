> Source: [Typography in Design](https://www.figma.com/resource-library/typography-in-design/) · [Font Pairings](https://www.figma.com/resource-library/font-pairings/) · [Best Fonts for Websites](https://www.figma.com/resource-library/best-fonts-for-websites/)

# Typography for Premium Web Design

## Quick Reference

| Metric | Specification |
|--------|--------------|
| Body font size (desktop) | **16-18px** (1-1.125rem) |
| Body font size (mobile) | **16-17px** (never below 16px) |
| Line height (body) | **1.5-1.7** |
| Line height (headings) | **1.1-1.3** |
| Line length (optimal) | **45-75 characters** (ideal: 66) |
| Paragraph spacing | **1.5x** the font size |
| Type scale ratio | **1.25** (Major Third) or **1.333** (Perfect Fourth) |
| Max typefaces per project | **2-3** (heading, body, optional accent) |
| Heading letter-spacing (caps) | **0.05-0.15em** |
| Luxury heading tracking | **0.08-0.12em** |

## Font Classification

| Type | Character | Use |
|---|---|---|
| Serif | Small stroke at end of letter | Trust, tradition, sophistication — headings for luxury |
| Sans Serif | No strokes | Clean, modern, readable — body text, UI |
| Slab Serif | Thick, rounded strokes | Bold, attention-grabbing — branding, headlines |
| Monospace | Equal character width | Code, technical content |
| Script | Handwriting / calligraphy | Display only, never body text |

## Premium Font Recommendations

### Sans-serif (body & UI)
Inter, Roboto, Open Sans, Lato, DM Sans, Source Sans Pro, Work Sans, Manrope, Nunito, Poppins, Plus Jakarta Sans, Outfit, Figtree, Onest

### Serif (headings & luxury)
Playfair Display, Cormorant Garamond, Lora, Libre Baskerville, Neuton, Fraunces, Instrument Serif, DM Serif Display, Zodiak

### Display (bold branding)
Satoshi, Clash Display, Cabinet Grotesk, Sora, Bebas Neue, Anton, Archivo Black

## Font Pairing Guidelines

### The 1-2 Font Rule
Use **maximum 2-3 typefaces** per project:
- 1 display/heading font (expressive)
- 1 body font (highly readable)
- Optional: 1 accent font (for special elements like quotes, badges)

### Classic Premium Pairings

| Heading | Body | Vibe |
|---|---|---|
| Playfair Display | Inter | Editorial, luxury |
| DM Serif Display | DM Sans | Sophisticated, modern |
| Fraunces | Work Sans | Warm, refined |
| Cormorant Garamond | Lato | Classic, high-end |
| Instrument Serif | Inter | Clean editorial |
| Satoshi (w/ weight contrast) | Inter | Modern sans-only |
| Zodiak | Outfit | Distinctive, premium |
| Clash Display | Plus Jakarta Sans | Bold, contemporary |

### Pairing Rules
- Pair fonts within same **x-height** range for visual harmony
- Pair a **generous** font (wide proportions) with a **compact** one
- Avoid pairing two serif or two display fonts together
- Use **weight contrast** (bold heading + regular body) even within same family

## Sizing System

### Modular Type Scale (1.25 ratio — Major Third)
```
--text-xs:   0.75rem  (12px)
--text-sm:   0.875rem (14px)
--text-base: 1rem     (16px)
--text-lg:   1.125rem (18px)
--text-xl:   1.25rem  (20px)
--text-2xl:  1.5rem   (24px)
--text-3xl:  1.875rem (30px)
--text-4xl:  2.25rem  (36px)
--text-5xl:  3rem     (48px)
--text-6xl:  3.75rem  (60px)
--text-7xl:  4.5rem   (72px)
```

### Luxury / Editorial Scale (1.333 ratio — Perfect Fourth)
```
--text-base: 1rem
--text-lg:   1.333rem
--text-xl:   1.777rem
--text-2xl:  2.369rem
--text-3xl:  3.157rem
--text-4xl:  4.209rem
--text-5xl:  5.61rem
```

### Body text sizing
- **Desktop**: 16-18px for body, 15-16px for UI labels
- **Mobile**: 16-17px for body (never below 16px to prevent zoom)
- **Line height**: 1.5-1.7 for body text, 1.1-1.3 for headings
- **Line length**: 45-75 characters per line (optimal: 66)
- **Paragraph spacing**: 1.5x the font size

### Optimal Line Length
- **Body text**: 45-75 characters per line (optimal: 66)
- **Longer lines**: Increase line height proportionally
- **Shorter lines**: Decrease line height slightly
- On mobile: narrower columns naturally produce shorter lines

```css
/* Control line length */
.text-content {
  max-width: 65ch; /* ~65 characters wide */
  margin-inline: auto;
}

.wide-content {
  max-width: 75ch;
}

.narrow-content {
  max-width: 45ch;
}
```

## CSS Text Wrapping (Modern)

```css
/* Prevent orphaned words */
h1, h2, h3, h4, h5, h6 {
  text-wrap: balance; /* Balances line lengths in headings */
}

p {
  text-wrap: pretty; /* Prevents single-word last lines */
}

/* For small text that should never wrap */
.badge {
  white-space: nowrap;
}
```

## Web Font Loading

```html
<!-- Preconnect to font CDN -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

<!-- Preload critical font -->
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />

<!-- Google Fonts CSS -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700&display=swap" />
```

```css
/* Font-display strategy */
@font-face {
  font-family: 'Custom Font';
  src: url('/fonts/custom.woff2') format('woff2');
  font-display: swap; /* Show fallback immediately, swap when loaded */
  font-weight: 400;
  font-style: normal;
  /* Optional: size-adjust to prevent layout shift */
  size-adjust: 102%;
}
```

### Preventing Layout Shift (CLS)

```css
/* Reserve space with fallback font matching */
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
}

/* Adjust fallback to match web font metrics */
@font-face {
  font-family: 'Inter Fallback';
  src: local('Arial');
  size-adjust: 102%;
  ascent-override: 90%;
  descent-override: 22%;
  line-gap-override: 0%;
}
```

## Variable Fonts
- Single file with adjustable weight/width/optical sizing axes
- Better performance (fewer HTTP requests)
- Use CSS `font-variation-settings` for precise control
- Recommended: Inter, Roboto Flex, Source Sans Variable, Recursive

```css
/* Variable font usage */
body {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
}

h1 {
  font-family: 'Inter', sans-serif;
  font-weight: 800; /* or font-variation-settings: 'wght' 800 */
}

/* Optical sizing */
p {
  font-optical-sizing: auto; /* Automatically adjusts for size */
}

/* Custom axes */
.condensed-text {
  font-variation-settings: 'wdth' 75; /* Width axis */
}

.italic-variable {
  font-variation-settings: 'slnt' -10; /* Slant axis */
}
```

## Premium Typography Techniques

### Letter-spacing (tracking)
- Headings (all-caps): 0.05em - 0.15em
- Body text: normal (0) or very subtle (0.01em)
- Luxury brands: slightly wider tracking on headings (0.08-0.12em)

```css
.heading-caps {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 600;
}

.luxury-heading {
  letter-spacing: 0.08em;
}

.body-text {
  letter-spacing: 0.01em;
}
```

### Ligatures and Numerals
```css
/* Enable common ligatures */
body {
  font-variant-ligatures: common-ligatures;
}

/* Tabular figures for tables, pricing */
.price {
  font-variant-numeric: tabular-nums; /* Monospaced numbers */
}

/* Proportional oldstyle for body text */
.article-text {
  font-variant-numeric: proportional-nums oldstyle-nums;
}

/* Lining figures for headings */
.heading {
  font-variant-numeric: lining-nums;
}
```

### Font smoothing
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
text-rendering: optimizeLegibility;
```

### Fluid typography with clamp()
```css
/* Scales smoothly between viewport sizes */
font-size: clamp(1rem, 0.5rem + 2vw, 3rem);
/* Example: heading that scales from 32px to 72px */
font-size: clamp(2rem, 1rem + 3vw, 4.5rem);
```

```css
/* Full fluid type scale */
:root {
  --text-h1: clamp(2rem, 1rem + 4vw, 4.5rem);
  --text-h2: clamp(1.5rem, 1rem + 2vw, 2.5rem);
  --text-h3: clamp(1.25rem, 1rem + 1vw, 1.5rem);
  --text-body: clamp(1rem, 0.9rem + 0.25vw, 1.125rem);
  --text-small: clamp(0.75rem, 0.7rem + 0.15vw, 0.875rem);
}
```

### Hierarchy techniques
- **Weight contrast**: Black/ExtraBold heading + Regular body
- **Size contrast**: At least 2x difference between heading and body
- **Color contrast**: Headings in darker shade, body in medium gray
- **Spacing**: More space above headings than below (margin-top > margin-bottom)

```css
h1 {
  font-size: var(--text-h1);
  font-weight: 800;
  color: var(--color-text-primary);
  margin-top: 0;
  margin-bottom: 0.5em;
}

h2 {
  font-size: var(--text-h2);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-top: 2em;
  margin-bottom: 0.5em;
}

p {
  font-size: var(--text-body);
  font-weight: 400;
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-bottom: 1.5em;
}
```

## Figma Typography Workflow
1. Create a **mood board** in FigJam to develop visual tone
2. Explore typeface options on [Google Fonts](https://www.figma.com/google-fonts/)
3. Test typefaces with **real content**, not placeholder text
4. Test brand colors on typeface: black text on white → brand color on white → reversed
5. Use Figma's **typeface exploration** template to compare options side-by-side
6. Set up **typography style guides** in Figma for consistent application across screens

## Cross-References
- See [design-tokens.md](./design-tokens.md) for typography tokens (font families, sizes, weights)
- See [color-theory.md](./color-theory.md) for text contrast ratios with colors
- See [accessibility.md](./accessibility.md) for accessible font sizes and contrast requirements
- See [layout-spacing.md](./layout-spacing.md) for vertical rhythm and spacing
- See [responsive-design.md](./responsive-design.md) for fluid typography techniques
- See [landing-pages.md](./landing-pages.md) for page-level typography hierarchy
