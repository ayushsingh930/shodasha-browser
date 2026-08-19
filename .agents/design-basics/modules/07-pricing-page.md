# Pricing Page Design — Paisa Ka Page

> Source: Figma "Pricing Page Best Practices + Examples"

## Pricing Page Structure

```
HEADER (Page title + short description)
────────────────────────────────────────
MONTHLY / ANNUAL TOGGLE
├── Monthly | Annual (save X%)
└── Highlighted savings badge
────────────────────────────────────────
PRICING CARDS (3-4 plans)
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Basic  │ │ Pro ★  │ │ Team   │ │ Enter. │
│ $9/mo  │ │ $29/mo │ │ $79/mo │ │ Custom │
│ [CTA]  │ │ [CTA]  │ │ [CTA]  │ │ [CTA]  │
│──features─│ │──features─│ │──features─│ │──features─│
└────────┘ └────────┘ └────────┘ └────────┘
──────────────────────────────────────────
COMPARISON TABLE (if many features)
├── Grouped by category
├── Checkmarks / tooltips
└── Sticky category headers
──────────────────────────────────────────
FAQ SECTION (~5 questions)
├── Q: What happens when I upgrade?
├── Q: Can I cancel anytime?
├── Q: Is there a free trial?
├── Q: Do you offer discounts?
└── Q: What payment methods?
──────────────────────────────────────────
FINAL CTA SECTION
├── "Still not sure?" + secondary CTA
└── Support contact link
```

## 8 Rules for Pricing Pages

### 1. Keep it Simple
- Plain language — mirror how customers talk
- Benefit-driven features, not tech specs
  - ✅ "Manage up to 10,000 customers"
  - ❌ "10 GB of storage"

### 2. Limit Plans (3-4 Tiers)
- Too many plans = analysis paralysis
- Arrange from lowest to highest commitment
- "Everything in [previous tier], plus..." pattern
- Highlight "Recommended"/"Most Popular" badge

### 3. Be Transparent
- No hidden fees — display costs clearly
- Use whole numbers where possible
- Per month / per user / per unit — be clear
- Annual savings shown prominently

### 4. Show Social Proof
- Testimonials near CTA buttons
- Customer logos (recognizable brands)
- Case study links
- Star ratings if available

### 5. Include Feature Comparison Table
- Group related features into labeled sections
- Use checkmarks + tooltips for explanations
- Accordion tables for long lists (mobile)
- Sticky category labels

### 6. Tooltips — Mobile First
- Use click/tap-triggered tooltips
- Hover-only doesn't work on mobile
- Info icon (i) or question mark (?)

### 7. Optimize for Mobile
- Stack plan cards vertically (not side-by-side)
- Replace tables with accordions on mobile
- Sticky CTA at bottom of screen
- Large enough buttons/tooltips/toggles (44px+)

### 8. Strong CTAs
- High-contrast colors
- Large, easy-to-tap buttons
- Button copy = exact next step ("Start Free Trial")
- Vary copy by tier ("Start Free", "Contact Sales")
- Sticky on scroll

## Recommended Plan Structure for Your Startup

| Feature | Free | Starter ($29/mo) | Professional ($79/mo) | Enterprise (Custom) |
|---------|------|-------------------|----------------------|---------------------|
| Users | 1 | 5 | 25 | Unlimited |
| CRM | Basic | Full | Full + Custom | Full + Enterprise |
| CMS | - | 3 sites | 10 sites | Unlimited |
| N8N agents | - | 2 agents | 10 agents | Custom agents |
| AI image gen | 5/mo | 50/mo | 500/mo | Unlimited |
| Support | Email | Chat | Priority | Dedicated |

## Mistakes to Avoid

- ❌ 17 plans — analysis paralysis
- ❌ Hidden fees — destroys trust
- ❌ Hover-only tooltips — mobile broken
- ❌ Feature-focused instead of benefit-focused
- ❌ No "Most Popular" badge — users don't know what to pick
- ❌ Cluttered comparison table with walls of text
- ❌ Social proof hidden far from CTAs

## Examples to Reference

- **Ahrefs** — 3 tiers, annual/monthly toggle, highlighted discount
- **Slack** — 4 tiers, free entry, "best value" badge, customer logos
- **Notion** — Clean, benefit-driven, free + team + enterprise
- **Retool** — Developer-focused, transparent pricing
- **Customer.io** — Feature comparison table with tooltips

## Figma Tips

- Use design system (text styles, color palette, buttons, badges)
- Figma Make can generate pricing layouts from prompts
- Figma Sites for responsive pricing page publishing
- Community templates for pricing page design
