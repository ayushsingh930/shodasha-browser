> Source: [What is Color Theory?](https://www.figma.com/resource-library/what-is-color-theory/) · [Color Combinations](https://www.figma.com/resource-library/color-combinations/) · [Color Symbolism](https://www.figma.com/resource-library/color-symbolism/)

# Color Theory for Premium Web Design

## Quick Reference

| Concept | Rule |
|---------|------|
| Palette ratio | **60%** neutral/dominant, **30%** secondary, **10%** accent |
| Normal text contrast | **4.5:1 minimum** (AA) |
| Large text contrast | **3:1 minimum** (AA) |
| Max colors per palette | 3-5 (primary, secondary, accent, neutral, surface) |
| Brand colors | 2-3 maximum |
| OKLCH for design | Better perceptual uniformity than HSL |
| CSS color-mix() | Dynamic color mixing at runtime |
| Dark mode text | Never pure white on pure black — use `#F5F0EB` on `#0A0A0A` |

## Color Wheel Basics
- **Primary**: Red, Yellow, Blue
- **Secondary**: Green, Orange, Violet
- **Tertiary**: Mix of primary + secondary

## Color Harmonies

| Harmony | Definition | Best Use |
|---|---|---|
| Complementary | Opposite on color wheel | High contrast, bold impact |
| Monochromatic | Single hue, different shades | Subtle, cohesive, professional |
| Analogous | Adjacent on color wheel | Natural, harmonious |
| Triadic | 3 colors equally spaced | Vibrant, playful, balanced |
| Tetradic | 4 colors in a rectangle (2 complementary pairs) | Complex, vivid contrast |
| Split Complementary | Base + 2 adjacent to its complement | Vibrant yet balanced |
| Square | 4 colors equally spaced in a square | Rich diversity, fine-tuning needed |

## Premium Color Psychology

| Color | Emotion |
|---|---|
| Dark Blue / Midnight | Trust, professionalism, reliability |
| Forest / Olive Green | Nature, growth, organic, grounding |
| Burgundy / Maroon | Confidence, stability, luxury |
| Deep Violet | Luxury, sophistication, creativity |
| Gold / Amber | Premium, success, warmth |
| Black / Charcoal | Power, sophistication, modernity |
| White / Off-white | Clarity, cleanliness, premium minimalism |
| Warm Gray / Taupe | Earthy sophistication, timeless |

## The 60-30-10 Rule
- **60%** dominant/neutral color (backgrounds, large areas)
- **30%** secondary color (headers, cards, sections)
- **10%** accent color (CTAs, highlights, interactive elements)

```css
/* Applying 60-30-10 via design tokens */
:root {
  /* 60% - Dominant background and text */
  --color-bg-primary: #FFFFFF;
  --color-text-primary: #1A1A2E;

  /* 30% - Secondary surface elements */
  --color-bg-secondary: #F3F4F6;
  --color-text-secondary: #6B7280;

  /* 10% - Accent for CTAs and highlights */
  --color-action-primary: #4F46E5;
  --color-action-hover: #4338CA;
}
```

## Color Properties
- **Hue**: The color itself (red, blue, green) — measured in degrees 0-360
- **Value**: How light or dark a color is (shade/tint) — measured 0-100%
- **Saturation**: Color intensity (vivid vs muted) — measured 0-100%
- **Temperature**: Warm (red/orange/yellow) vs Cool (blue/green/purple)
- **Lightness**: In OKLCH/HSL, perceptual brightness
- **Chroma**: In OKLCH, color purity (better than saturation for perception)

## Warm vs Cool Color Psychology
| Temperature | Emotions | Brands |
|---|---|---|
| Warm (red, orange, yellow) | Energy, passion, excitement, urgency | Coca-Cola, Red Bull, Netflix |
| Cool (blue, green, purple) | Trust, calm, professionalism, security | IBM, Blue Shield, PayPal |
| Neutral (black, white, gray) | Sophistication, balance, modernity | Apple, Tesla, Muji |

## Working with OKLCH (Modern Color Space)

OKLCH provides better perceptual uniformity than HSL or hex. Use it for accessible, consistent color scales:

```css
/* OKLCH syntax */
:root {
  --blue-500: oklch(0.62 0.19 260); /* lightness, chroma, hue */
  --blue-600: oklch(0.52 0.18 260);
  --blue-700: oklch(0.42 0.16 260);
  --red-500: oklch(0.55 0.22 27);
  --green-500: oklch(0.55 0.17 150);
}
```

### Generating Accessible Color Scales

```css
/* OKLCH ensures consistent perceived lightness */
:root {
  --gray-50:  oklch(0.98 0 0);
  --gray-100: oklch(0.95 0 0);
  --gray-200: oklch(0.90 0 0);
  --gray-300: oklch(0.82 0 0);
  --gray-400: oklch(0.74 0 0);
  --gray-500: oklch(0.62 0 0);
  --gray-600: oklch(0.50 0 0);
  --gray-700: oklch(0.38 0 0);
  --gray-800: oklch(0.28 0 0);
  --gray-900: oklch(0.18 0 0);
}
```

## CSS color-mix() for Dynamic Palettes

```css
/* Create tints and shades dynamically */
:root {
  --brand: #4F46E5;
  --brand-light: color-mix(in oklch, var(--brand) 20%, white);
  --brand-dark: color-mix(in oklch, var(--brand) 80%, black);
  --brand-subtle: color-mix(in oklch, var(--brand) 10%, white);
  --brand-contrast: color-mix(in oklch, var(--brand), white 85%);
}

/* Dynamic hover states without hardcoding */
.btn-primary:hover {
  background: color-mix(in oklch, var(--color-action-primary), black 10%);
}

.btn-primary:active {
  background: color-mix(in oklch, var(--color-action-primary), black 20%);
}
```

## Premium Palette Formulas

### Modern Minimalist
```
Background: #FFFFFF or #F8F9FA
Text:       #1A1A2E or #2D3436
Accent:     #4F46E5 or #0066FF
Secondary:  #E8E8EC or #DFE6E9
```

### Dark Luxury
```
Background: #0A0A0A or #1A1A1A
Text:        #F5F0EB or #E8E0D8
Accent:      #C9A96E or #D4AF37 (gold)
Secondary:   #2A2A2A or #333333
Highlight:   #F5E6C8 (champagne)
```

### Bold & Expressive
```
Background: #0F0F1A
Text:        #FFFFFF
Accent:      #FF6B6B or #7C3AED
Secondary:   #1E1E3F or #2D2D5E
Gradient:    #FF6B6B → #7C3AED
```

### Earthy Premium
```
Background: #FAF7F2 or #F5F0EB
Text:        #2C1810 or #3E2723
Accent:      #8B6F47 or #A67C52
Secondary:   #E8DDD0 or #D4C5B2
Highlight:   #C9A96E
```

## CSS Gradient Patterns

```css
/* Subtle premium gradient */
.hero-gradient {
  background: linear-gradient(
    135deg,
    oklch(0.18 0.02 280) 0%,
    oklch(0.12 0.04 260) 50%,
    oklch(0.08 0.02 240) 100%
  );
}

/* Two-tone accent gradient */
.accent-gradient {
  background: linear-gradient(
    135deg,
    var(--color-action-primary) 0%,
    color-mix(in oklch, var(--color-action-primary), var(--color-accent-secondary) 50%) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
```

## Contrast Validation

```css
/* Verify contrast at the token level */
:root {
  --text-primary: #1A1A2E;    /* L: 3.8% */
  --bg-primary: #FFFFFF;      /* L: 100% */
  /* Contrast ratio: (1.05 + 0.05) / (0.038 + 0.05) = 12.2:1 ✓ AA ✓ AAA */
}
```

### Minimum contrast reference table

| Foreground | Background | Ratio | Passes |
|---|---|---|---|
| #1A1A2E | #FFFFFF | 12.2:1 | AA, AAA |
| #6B7280 | #FFFFFF | 4.7:1 | AA (text), Fails AAA |
| #9CA3AF | #FFFFFF | 3.0:1 | Fails AA (text), OK for large text |
| #FFFFFF | #0A0A0A | 18.4:1 | AA, AAA |
| #E5E7EB | #0A0A0A | 12.5:1 | AA, AAA |
| #9CA3AF | #0A0A0A | 8.8:1 | AA, AAA |
| #F5F0EB | #1A1A1A | 10.8:1 | AA, AAA |

## When to use dark backgrounds
- Luxury / high-end brands
- Portfolio / showcase sites (art, photography, video)
- SaaS products targeting professionals
- Entertainment / gaming
- For OLED battery savings on mobile

## When to use light backgrounds
- Content-heavy sites (blogs, news, documentation)
- E-commerce (product photography pops on white)
- Healthcare, finance (clarity = trust)
- Most SaaS B2B applications
- Long-form reading (reduces eye strain)

## Cross-References
- See [design-tokens.md](./design-tokens.md) for tokenizing color with OKLCH values
- See [accessibility.md](./accessibility.md) for WCAG contrast compliance details
- See [typography.md](./typography.md) for color-on-type contrast requirements
- See [web-design-trends.md](./web-design-trends.md) for OKLCH and color-mix() trend usage
