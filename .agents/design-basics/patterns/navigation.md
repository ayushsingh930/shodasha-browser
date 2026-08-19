# Navigation Patterns

## Pattern 1: Top Nav (Standard — Recommended)

```
┌──────────────────────────────────────────────┐
│ [Logo]  Product  Features  Pricing  About │ [CTA]│
│                                              │
│            ┌──────┐                         │
│            │Dropdown│ when hover on Product  │
│            │ CRM   │                         │
│            │ CMS   │                         │
│            │ AI Agents │                     │
│            └──────┘                         │
└──────────────────────────────────────────────┘
```

**Specs:**
- Max 7 nav items (cognitive load limit)
- Logo = top-left (90% websites ka standard)
- CTA = right-most item
- Sticky on scroll (z-index: 1000)
- Height: 64-80px

## Pattern 2: Hamburger Nav (Mobile)

```
┌──────────────────────────────────────────────┐
│ [Logo]                              [☰]      │
│                                              │
│  When ☰ is clicked:                        │
│  ┌──────────────────────────────────────┐   │
│  │ Product                              │   │
│  │   ├ CRM                              │   │
│  │   ├ CMS                              │   │
│  │   └ AI Agents                        │   │
│  │ Features                             │   │
│  │ Pricing                              │   │
│  │ About                                │   │
│  │ [Get Started →] (full width)        │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

**Specs:**
- Hamburger = standard mobile pattern
- Menu = full-screen overlay OR slide-in drawer
- CTA = full-width button at bottom of menu
- Close = X button top-right
- Backdrop blur behind menu

## Pattern 3: Bottom Nav (Mobile App-like)

```
┌──────────────────────────────────────────────┐
│                                              │
│           (Page Content)                     │
│                                              │
├──────────────────────────────────────────────┤
│  [🏠]  [📊]  [🤖]  [⚙️]  [👤]                │
│  Home  Dashboard  Agents  Settings  Profile  │
└──────────────────────────────────────────────┘
```

**Specs:**
- 3-5 tabs max
- Active tab = highlighted
- Icons + labels
- Height: 56-64px
- Safe area inset for notched phones
- Best for: app-like experiences (dashboard tools)

## Navigation Design Rules

1. **Logo = top-left** — 90% websites ka standard, users expect it
2. **Active state** — always show which page user is on
3. **Sticky nav** — always accessible
4. **Max 7 items** — zyada = cognitive load
5. **CTA button visible** — "Get Started" or "Sign Up" always accessible
6. **Mobile hamburger** — 3-line icon, not just word "Menu"
7. **Dropdowns** — hover on desktop, tap on mobile
8. **Bottom nav** for app, top nav for website

## Your Startup's Navigation

```
Landing Page Nav:
[Logo]   CRM   CMS   AI Agents   Pricing   [Get Started →]

Dashboard Nav (logged in):
[Logo]   Dashboard   CRM   CMS   AI Agents   Settings   [Profile]

Mobile (both):
[Logo] ☰ → Home | CRM | CMS | AI Agents | Pricing | About | Get Started
```

## Common Mistakes

- ❌ Too many nav items (8+)
- ❌ No active state indicator
- ❌ Nav not sticky — users scroll up to navigate
- ❌ Mobile hamburger with no animation
- ❌ Logo linked to homepage? Yes — always
- ❌ CTA hidden on mobile
- ❌ Dropdowns that work on hover but not tap
