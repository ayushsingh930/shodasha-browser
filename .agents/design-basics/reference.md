# Design Basics — Quick Reference Cheat Sheets

> Yeh cheat sheet hai — jab tez tez design decisions lene ho toh yeh deck kaam aayega.

---

## Color Quick Reference

| Scheme | Description | Example |
|--------|-------------|---------|
| Monochromatic | Ek color ke different shades | Dark blue → light blue |
| Analogous | 3 adjacent colors on wheel | Blue, blue-green, green |
| Complementary | Opposite colors | Blue + Orange |
| Triadic | 3 evenly spaced | Red, yellow, blue |
| Split-complementary | Base + 2 adjacent to opposite | Blue + yellow-orange + red-orange |

**60-30-10 Rule:** 60% neutral, 30% secondary, 10% accent

---

## Typography Quick Reference

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 48-64px | Bold (700) | 1.1-1.2 |
| H2 | 32-48px | Bold (700) | 1.2 |
| H3 | 24-32px | Semi-Bold (600) | 1.3 |
| Body | 16-18px | Regular (400) | 1.5 |
| Small | 12-14px | Regular (400) | 1.4 |
| Caption | 11-12px | Medium (500) | 1.3 |

**Line Length:** 40-60 characters per line

---

## Spacing Scale (8px System)

| Token | PX | Use Case |
|-------|-----|----------|
| 4xs | 2px | Border, icon gap |
| 3xs | 4px | Tight spacing |
| 2xs | 8px | Small gap |
| xs | 12px | Button padding small |
| sm | 16px | Base unit, button padding |
| md | 24px | Card padding, section gap |
| lg | 32px | Section margin |
| xl | 48px | Big section gap |
| 2xl | 64px | Hero spacing |
| 3xl | 96px | Page section margin |

---

## Responsive Breakpoints

| Name | Min Width | Design For |
|------|-----------|------------|
| Mobile | 360px | 1 column, stacked |
| Tablet | 768px | 2 columns |
| Desktop | 1024px | Multi-column |
| Wide | 1440px+ | Max-width container |

---

## Button States (All 9)

1. Default → 2. Hover → 3. Active → 4. Focus → 5. Disabled → 6. Loading → 7. Error → 8. Success → 9. Visited

**Transition duration:** 100-200ms (WCAG recommends 200ms+ for users who need more time)

---

## Figma Variables Naming Convention

**Primitive → Semantic → Component**

```
color/blue/500          →  color/brand/primary    →  button/bg/primary
color/grey/200          →  color/bg/surface       →  card/bg/default
font-size/16            →  font/body/medium       →  heading/md/line-height
spacing/16              →  space/inset/sm         →  card/padding/default
```

---

## Top 5 Web Design Statistics 2026

1. 51.4% of spending happens on mobile
2. 94.8% of homepages fail WCAG
3. 71% expect personalization, only 34% deliver
4. 68% of developers use AI for code
5. 52% stop using a brand after one bad experience

---

## Landing Page Anatomy

```
┌──────────────────────────┐
│ NAV BAR (Logo + CTA)     │
├──────────────────────────┤
│ HERO                      │
│ Headline + Subtext + CTA │
│ Hero Image/Video          │
├──────────────────────────┤
│ Social Proof              │
│ (Logos, testimonials)     │
├──────────────────────────┤
│ Features / Benefits       │
│ (3-column grid)           │
├──────────────────────────┤
│ How It Works              │
│ (3-step process)          │
├──────────────────────────┤
│ FAQ                       │
│ (5 questions accordion)   │
├──────────────────────────┤
│ Final CTA                 │
│ (Strong closing)          │
└──────────────────────────┘
```

---

## Pricing Page Anatomy

```
┌──────────────────────────────────┐
│ Monthly / Annual toggle          │
│ (save X% highlighted)           │
├──────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐      │
│ │Basic │ │Pro ★ │ │Enterprise│ │
│ │$9/mo │ │$29/mo│ │$99/mo │    │
│ │CTA   │ │CTA   │ │CTA   │    │
│ └──────┘ └──────┘ └──────┘      │
├──────────────────────────────────┤
│ Comparison Table                │
│ (Features + checkmarks)         │
├──────────────────────────────────┤
│ FAQ (5 questions)               │
└──────────────────────────────────┘
```

---

## Mobile vs Desktop Design Differences

| Element | Mobile | Desktop |
|---------|--------|---------|
| Layout | Single column | Multi-column |
| Navigation | Hamburger / Bottom nav | Top nav bar |
| Buttons | Full width, 44px+ | Inline, 32px+ |
| Images | Full width, stacked | Side-by-side |
| Forms | Single column, large fields | Inline where possible |
| Content | Condensed, scrollable | Visible, spacious |
| CTAs | Sticky bottom | Hero section |

---

## Quick Tools

- **Color palette**: coolors.co, Figma color wheel
- **Contrast checker**: WebAIM, Stark plugin (Figma)
- **Font pairing**: fontpair.co, Google Fonts
- **Grid**: 8px grid plugin (Figma)
- **Icons**: Phosphor, Lucide, Material Icons
- **Illustrations**: unDraw, Humaaans, Blush
- **Mock data**: Figma variables, JSON to design plugins
