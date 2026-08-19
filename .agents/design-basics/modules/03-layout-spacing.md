# Layout & Spacing — Structure Ka Science

> Source: Figma "Web Design" + "UI Design Principles" + "Static vs Dynamic"

## Core Layout Principles

### 1. Visual Hierarchy
- Most important element = most visually prominent
- Size, color, position, and spacing create hierarchy
- Users scan in **F-pattern** (left to right, top to bottom)
- **50 milliseconds** — users form opinion in that time

### 2. 8px Grid System
Use multiples of 8 for all spacing decisions:
```
2px  → 4px  → 8px  → 16px → 24px
32px → 48px → 64px → 96px → 128px
```

### 3. White Space = Design Feature
- Breathing room between elements increases comprehension
- 52% users stop after one bad experience — clutter contributes
- Don't fill every pixel — let content breathe

### 4. Mobile-First Responsive
- Design for 360x800 first
- Then tablet (768px)
- Then desktop (1280px+)
- Stack on mobile, columns on desktop

## Layout Patterns for Your Startup

| Page Type | Layout Pattern |
|-----------|---------------|
| Landing/Hero | Single column, full-width sections |
| Features | Bento grid (2-3 column) |
| Dashboard | Sidebar + content area |
| Pricing | 3-column cards, stacked on mobile |
| Blog/Content | 1 column + sidebar on desktop |
| Portfolio | Masonry / split-screen |
| Documentation | Left nav + content (dynamic) |

## Responsive Design Decision Flow

```
Desktop Layout (1280px+)
        ↓
  Did it break? → YES → Add breakpoint at ~1024px
        ↓ NO                          ↓
Tablet Layout (768px)             Adjust for tablet
        ↓
  Did it break? → YES → Add breakpoint at ~768px
        ↓ NO                          ↓
Mobile Layout (360px)             Adjust for mobile
        ↓
  DONE ✓
```

## Auto Layout in Figma

- **Hug content** — component ki size content ke hisaab se
- **Fill container** — stretch to fill available space
- **Spacing between items** — consistent gaps
- **Padding** — inner spacing of container
- **Wrap** — items ko next line bhej de space na ho toh

## Section Structure for Web Pages

```
CONTAINER (max-width: 1200px centered)
├── NAV (sticky)
├── HERO (full-width bg + centered content)
├── FEATURES (grid: 3 columns → 2 → 1)
├── HOW IT WORKS (numbered steps, horizontal → vertical)
├── SOCIAL PROOF (logos row, scrollable)
├── PRICING (3 cards)
├── FAQ (accordion, centered, max-width 720px)
├── CTA (full-width bg, centered)
├── FOOTER (4-column → 2-column → 1)
```

## Common Layout Mistakes

1. ❌ No consistent grid — random spacing
2. ❌ Content too wide on large screens (>1440px max-width)
3. ❌ Mobile design = squished desktop (mobile-first karo)
4. ❌ Too many columns on mobile
5. ❌ Ignoring touch targets (min 44px tap area)
6. ❌ Text in full-width lines (crosses 60-char limit)
