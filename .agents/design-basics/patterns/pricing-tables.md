# Pricing Table Patterns

## Pattern 1: 3-Tier Card Layout (Recommended)

```
┌──────────────┬──────────────┬──────────────┐
│    FREE      │   STARTER    │  PROFESSIONAL │
│              │  ★ Most Pop ★│              │
│   $0/mo      │   $29/mo     │   $79/mo     │
│              │   $24/mo yr  │   $65/mo yr  │
├──────────────┼──────────────┼──────────────┤
│  ✓ 1 user    │  ✓ 5 users   │  ✓ 25 users  │
│  ✓ Basic CRM │  ✓ Full CRM  │  ✓ Full CRM  │
│  ✓ 5 AI gen  │  ✓ 50 AI gen │  ✓ 500 AI gen│
│  ✗ N8N agent │  ✓ 2 agents  │  ✓ 10 agents │
│  ✗ CMS       │  ✓ 3 sites   │  ✓ 10 sites  │
│  ✗ Priority  │  ✗ Priority  │  ✓ Priority  │
├──────────────┼──────────────┼──────────────┤
│ [Get Started]│ [Start Trial]│ [Contact Us] │
│              │  (Highlight) │              │
└──────────────┴──────────────┴──────────────┘
```

**Specs:**
- 3-4 cards in a row (stack on mobile)
- "Most Popular" badge on recommended plan
- Highlighted card: slightly larger, different border/shadow
- Monthly/annual toggle at top
- Feature rows: checkmark (✓) or cross (✗)
- CTA per card

## Pattern 2: Feature Comparison Table

```
                    Free    Starter   Pro     Enterprise
Monthly Price       $0      $29       $79     Custom
Users               1       5         25      Unlimited
CRM              ✓ Basic  ✓ Full    ✓ Full   ✓ Custom
CMS              —        3 sites   10 sites Unlimited
AI Agents        —        2         10       Custom
AI Image Gen     5/mo     50/mo     500/mo   Unlimited
Support           Email    Chat      Priority Dedicated
Custom Domain     —        —         ✓        ✓
API Access        Limited  ✓         ✓        ✓
SLA               —        —         99.9%    99.99%

              [CTA]    [CTA]★    [CTA]     [CTA]
```

**Specs:**
- Group related features with headers
- Sticky row headers on scroll
- Tooltips on complex features
- Accordion on mobile (collapsed by default)

## Pattern 3: Simple 2-Tier Layout

```
┌──────────────────────┬──────────────────────┐
│                       │                       │
│       STARTUP         │     ENTERPRISE        │
│                       │                       │
│       $29/mo          │     Custom            │
│                       │                       │
│  Everything you need  │  Built for scale      │
│  to get started       │  Enterprise-grade     │
│                       │                       │
│  ✓ Core Features      │  ✓ Everything in      │
│  ✓ 5 users            │    Startup +         │
│  ✓ Standard support   │  ✓ Unlimited users    │
│                       │  ✓ Dedicated support  │
│                       │  ✓ Custom AI agents   │
│                       │  ✓ SLA guarantee      │
│                       │                       │
│  [Start Free Trial]   │  [Contact Sales]      │
│                       │                       │
└──────────────────────┴──────────────────────┘
```

**Specs:**
- Good for simple SaaS or early-stage
- Clear differentiation between tiers
- "Most Popular" badge if needed
- Under each: "No credit card required"

## Pricing Page Design Rules

### Layout Rules
- 3-4 plan cards in horizontal row, stack vertically on mobile
- Recommended/most popular plan visually distinct (border, badge, slight scale)
- Monthly/Annual toggle at top (save X% highlighted)
- Features listed consistently across all plans
- CTAs prominent at bottom of each card

### Copy Rules
- Benefit-driven features (not technical specs)
- Clear pricing: $29/mo not "Starting from $29"
- Annual pricing: show savings ("Save 20% with annual")
- "Custom" for enterprise (not $999+ —scares small businesses)

### Visual Rules
- Same card width for all tiers
- Highlighted plan: 1.05x scale, accent border, "Most Popular" badge
- Contrasting CTA colors (recommended plan CTA = brand, others = outline)
- Icons for features (checkmark, cross, info)

## Mobile Adjustments

| Element | Desktop | Mobile |
|---------|---------|--------|
| Cards | Side by side (3-4) | Stacked vertically |
| Comparison table | Full table | Accordion sections |
| Toggle | Horizontal | Full width |
| CTA | Button at card bottom | Sticky at screen bottom |
| Feature list | Visible | Expandable |
| Pricing | Next to toggle | Below toggle |

## Common Mistakes on Pricing Pages

1. ❌ Too many plans (analysis paralysis)
2. ❌ Hidden fees or unclear pricing
3. ❌ No "Most Popular" recommendation
4. ❌ Feature rows not aligned vertically
5. ❌ Same CTA copy for all plans
6. ❌ No FAQ section to answer objections
7. ❌ Hover-only tooltips (broken on mobile)
8. ❌ No annual/monthly comparison
9. ❌ Enterprise "Contact Us" with no price range hinted
10. ❌ Not optimized for mobile (cards too small)
