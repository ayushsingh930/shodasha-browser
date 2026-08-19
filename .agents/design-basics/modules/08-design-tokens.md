# Design Tokens — Design System Ki Bhasha

> Source: Figma "Design Tokens: How to Sync Design and Code"

## What Are Design Tokens?

Design tokens = design decisions ka code-friendly representation. Colors, spacing, fonts, shadows — sab kuch ek structured format mein.

**Token = Name for a role, NOT for the appearance**

```
❌ Bad:  color/blue/500    (what if you change brand color?)
✅ Good: color/brand/primary  (describes ROLE, not color)
```

## 3-Layer Token Hierarchy

### Layer 1: Primitive Tokens (Raw Values)
```
color/blue/50      → #EFF6FF
color/blue/500     → #3B82F6
color/grey/200     → #E5E7EB
spacing/4          → 4px
spacing/8          → 8px
font-size/16       → 16px
border-radius/4    → 4px
```

### Layer 2: Semantic Tokens (Meaning-Based)
```
color/bg/primary       → {color.blue.500}
color/bg/surface       → {color.white}
color/text/primary     → {color.grey.900}
color/text/secondary   → {color.grey.500}
color/border/default   → {color.grey.200}
space/inset/sm         → {spacing.16}
space/stack/md         → {spacing.24}
font/body/default      → {font-size.16}
font/heading/lg        → {font-size.32}
```

### Layer 3: Component Tokens (Specific to UI)
```
button/bg/primary      → {color.bg.primary}
button/text/primary    → {color.white}
button/padding         → {space.inset.sm}
button/border-radius   → {border-radius.4}
card/bg/default        → {color.bg.surface}
card/padding           → {space.inset.md}
card/shadow            → {shadow.sm}
heading/lg/font        → {font.heading.lg}
heading/lg/line-height → 1.2
```

## Why Use Tokens?

- **Consistency** — ek change, sab jagah reflect
- **Scalability** — themes (dark/light) = token values swap
- **Design-Dev Bridge** — same tokens in Figma + code
- **Brand Updates** — ek color change = poora design update
- **Teams** — multiple designers, same language

## Figma Variables = Tokens

Figma Variables are the implementation of design tokens in Figma:

1. **Primitive collection** — Raw color, spacing, radius values
2. **Semantic collection** — Mode-agnostic (light/dark)
3. **Component collection** — Specific to UI components

### Dark Mode with Variables
```
Light Mode:
  color/bg/surface → color/white
  color/text/primary → color/grey/900

Dark Mode:
  color/bg/surface → color/grey/900
  color/text/primary → color/white
```

## Naming Convention

```
<category>/<type>/<role>[-<state>][-<scale>]
```

Examples:
```
color/brand/primary
color/bg/surface-hover
spacing/padding/md
border-radius/sm
font-size/body/default
shadow/elevation/1
```

## Token Categories for Your Startup

| Category | Tokens Needed |
|----------|---------------|
| Color | Brand, BG, Text, Border, Status (success/error/warning) |
| Typography | Font family, size, weight, line-height |
| Spacing | Inset (padding), Stack (margin), Inline (gap) |
| Border | Radius, Width, Style |
| Shadow | Elevation levels (1-5) |
| Opacity | Disabled, overlay, muted |
| Breakpoint | Mobile, tablet, desktop, wide |

## Figma Tips

- **Local variables** — file-level tokens
- **Linked variables** — across team library
- **Modes** — for theme switching (light/dark/high contrast)
- **Variable aliases** — shallow vs deep aliasing
- **Code sync** — Dev Mode → CSS variables export
