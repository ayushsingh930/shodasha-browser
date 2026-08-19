# Forms & CTA Patterns

## Sign-Up Form Pattern

```
┌──────────────────────────┐
│     Create Your Account   │
│                           │
│  [Google] [GitHub] [Apple]│
│         or                │
│  ┌────────────────────┐  │
│  │ Email              │  │
│  ├────────────────────┤  │
│  │ Password           │  │
│  ├────────────────────┤  │
│  │ I agree to Terms   │  │
│  │ ☐                  │  │
│  ├────────────────────┤  │
│  │ [Create Account →] │  │
│  └────────────────────┘  │
│  Already have an account?│
│        Log in            │
│                           │
│  "No credit card needed"  │
└──────────────────────────┘
```

**Specs:**
- Social login options first (reduces friction)
- Email + password = minimum fields for signup
- Terms checkbox = legally required
- "No credit card" reassurance (if free tier)
- Single column (converts better than multi-column)
- Max 5 fields
- Error messages inline (below field)

## Contact Form Pattern

```
┌──────────────────────────┐
│     Get in Touch          │
│                           │
│  ┌────────────────────┐  │
│  │ Name               │  │
│  ├────────────────────┤  │
│  │ Email              │  │
│  ├────────────────────┤  │
│  │ Company            │  │
│  ├────────────────────┤  │
│  │ Subject            │  │
│  │ [Dropdown ▼]       │  │
│  ├────────────────────┤  │
│  │ Message            │  │
│  │ [Textarea]         │  │
│  ├────────────────────┤  │
│  │ [Send Message →]   │  │
│  └────────────────────┘  │
│  Response within 24hrs   │
└──────────────────────────┘
```

**Specs:**
- Label above field (not just placeholder — accessibility!)
- Inline validation
- Submit button = full width on mobile
- Privacy note near submit
- Max 6 fields

## CTA Button Design Rules

### Visual Specs
- **Height:** 48-56px (min 44px for accessibility)
- **Padding:** 16-24px horizontal, 12-16px vertical
- **Border-radius:** 6-12px (lower for professional, higher for playful)
- **Font:** Semi-bold (600), 16-18px
- **Transition:** 150-200ms for hover/active

### States
```
Default:   [bg=brand]                 [text=white]
Hover:     [bg=brand-darken 10%]     [transition]
Active:    [transform: scale(0.97)]   [inner shadow]
Focus:     [ring/outline]            [keyboard users]
Disabled:  [opacity: 50%]            [cursor: not-allowed]
Loading:   [spinner + hide text]     [pointer-events: none]
```

### Copy Guidelines
| Good CTA Text | Bad CTA Text |
|--------------|--------------|
| "Get Started Free" | "Submit" |
| "Create Your Account" | "Click Here" |
| "Start Free Trial" | "Sign Up Now" |
| "Talk to Sales" | "Contact Us" |
| "See Pricing" | "Click for Info" |
| "Launch Your AI Agent" | "Begin" |

### Hierarchy
- **Primary CTA** — filled/high-contrast, most prominent
- **Secondary CTA** — outlined or ghost style, less prominent
- **Tertiary CTA** — text link only

## Form Design Rules

1. **Single column** — converts 10-15% better than multi-column
2. **Label above field** — better readability than left-aligned
3. **Inline validation** — real-time error checking
4. **Error message = specific** — "Email must contain @" not "Invalid"
5. **Success confirmation** — "Account created! Check your email."
6. **Min fields** — every additional field reduces conversions
7. **Group related fields** — Personal Info, Account, Payment
8. **Progress bar** for multi-step forms
9. **Touch targets** — 44px minimum for all interactive elements
10. **Auto-advance** — press Enter moves to next field

## Your Startup's Key Forms

| Form | Fields | Priority |
|------|--------|----------|
| Sign Up | Email, Password, Name, Terms | Critical |
| Login | Email, Password | Critical |
| CRM Lead Form | Name, Email, Phone, Company, Notes | Core |
| AI Agent Config | Name, Description, Type, Model, Temperature | Core |
| Checkout | Card, Billing Address | Business |
| Password Reset | Email | Utility |
| Contact | Name, Email, Subject, Message | Support |

## Common Mistakes

- ❌ Placeholder as label — disappears when typing
- ❌ No inline validation — submit then error
- ❌ Too many fields — 10+ field signup form
- ❌ Generic CTA — "Submit" instead of action text
- ❌ No error recovery — form clears on error
- ❌ Disabled submit button without explanation
- ❌ No success confirmation
- ❌ Tiny touch targets (< 44px)
