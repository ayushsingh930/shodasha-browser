# Design Guardrails — AI ko Ugly Design Se Bachao

> **Sabse pehle ye file padho!** Ye rules ensure karein ge ki AI koi bhi design generate karte waqt hallucinate na kare aur professional output de.

---

## 1. Color Guardrails 🎨

### DO's
- **Max 3 primary colors** ek palette mein (primary + secondary + accent) — zyada colors = chaos
- **60-30-10 rule** follow karo: 60% dominant, 30% secondary, 10% accent
- **Contrast ratio WCAG AA** (4.5:1 normal text, 3:1 large text) — check karo warna 79.1% websites ki tarah fail karoge
- **Dark mode ready** — har project mein dark/light toggle ka plan rakho
- **Brand colors consistent** — har element mein ek hi palette use karo
- **Color = meaning** — red for errors/urgency, green for success, blue for primary actions
- **Use color variables** — Figma variables se colors define karo, hardcode mat karo

### DON'Ts
- ❌ Neon green + bright red + electric blue ek saath — padosi ki Holi nahi hai
- ❌ Low contrast text on background (jaise grey text on light grey)
- ❌ 5+ different colors in one page
- ❌ Random colors without brand connection
- ❌ Sirf color par rely karna for important information — colorblind users yaad rakho (1 in 12 men)
- ❌ Pure black (#000) bg par white text — eye strain hota hai, use dark grey (#1a1a1a)

### Color Psychology Quick Reference
| Color | Vibe | Best For |
|-------|------|----------|
| Blue | Trust, professional | Enterprise, finance, SaaS |
| Green | Growth, nature, wealth | Finance, health, sustainability |
| Red | Urgency, passion, danger | CTAs, sales, alerts |
| Purple | Luxury, creativity, wisdom | Beauty, premium, spirituality |
| Orange | Energy, playfulness, affordable | CTA buttons, fitness, startups |
| Yellow | Optimism, warmth, caution | Highlights, children, food |
| Black | Luxury, power, elegance | Luxury brands, high-end products |

---

## 2. Typography Guardrails ✒️

### DO's
- **Max 2 font families** per project (1 heading + 1 body). Kabhi bhi 5 fonts ek saath mat use karo
- **Body text 16px minimum** — readability first. Chhoti font se users bhag jayenge
- **Line height: 1.5 for body, 1.2 for headings**
- **Line length: 40-60 characters per line** — padhne mein aasan
- **Font weights: Regular (400), Medium (500), Semi-Bold (600), Bold (700)** — use consistent hierarchy
- **Hierarchy clear karo**: H1 > H2 > H3 > Body > Caption — visually distinguishable
- **Sans-serif for UI/text-heavy**, Serif for headings/luxury brands

### DON'Ts
- ❌ Comic Sans, Papyrus, Curlz MT — kabhi nahi (unless intentionally ironic)
- ❌ 3+ different fonts in ek page — circus lagta hai
- ❌ All caps body text — CHILLAO MAT
- ❌ Too thin fonts (weight < 300) on light backgrounds — dikhega nahi
- ❌ Mixing serif with script — typography schizophrenia
- ❌ Justified text alignment for web — rivers of whitespace ban jaate hain

### Web Safe Fonts vs Custom Fonts
- **System fonts safe hai**: Inter, Roboto, Open Sans, Lato, Montserrat
- **Custom fonts**: Use Google Fonts ya Figma font integration — loading time optimize karo
- **Variable fonts**: Ek font file mein multiple weights — performance boost

---

## 3. Layout & Spacing Guardrails 📐

### DO's
- **8px grid system** use karo (4px / 8px / 16px / 24px / 32px / 48px / 64px / 96px spacing)
- **Consistent padding**: content area se lekar component tak same spacing
- **Visual hierarchy**: most important element = sabse prominent (size, color, position)
- **White space = feature, nahi waste** — breathing room do elements ko
- **Mobile-first responsive**: 360x800 pehle design karo, phir tablet, phir desktop
- **Single column mobile, multi-column desktop**
- **Figma Auto Layout** use karo — responsive design ka superpower

### DON'Ts
- ❌ Random spacing — kabhi 12px, kabhi 17px, kabhi 23px (like drunk designer)
- ❌ Sab kuch ek saath bina whitespace ke — clutter
- ❌ Mobile design without considering touch targets (min 44px)
- ❌ Desktop pehle design karna phir mobile ke liye squish karna
- ❌ Uneven margins/padding on different sections
- ❌ Text without proper line breaks ya paragraphs

### Responsive Breakpoints
| Device | Width | Approach |
|--------|-------|----------|
| Mobile | 360px - 480px | Single column, stacked |
| Tablet | 768px - 1024px | 2 columns, side panels |
| Desktop | 1280px+ | Multi-column, full layout |
| Large | 1920px+ | Max-width containers, whitespace |

---

## 4. UI Component Guardrails 🧩

### Button States (9 Required)
1. **Default** — normal state
2. **Hover** — subtle change (darken 10% / lighten 10%)
3. **Active/Pressed** — inner shadow, scale(0.97)
4. **Focus** — outline/ring for keyboard users (accessibility!)
5. **Disabled** — 50% opacity, no pointer events
6. **Loading** — spinner, button text disabled
7. **Error/Warning** — shake animation, red border
8. **Success** — green check, brief confirmation
9. **Visited** (for links) — different color

### Touch Targets
- **Min 44x44px** for mobile (Apple HIG & Google Material guidelines)
- Min 32x32px for desktop
- Spacing between touch targets: min 8px

### Navigation
- Logo = top-left (90% websites ka standard)
- Max 7 nav items — zyada = cognitive load
- Mobile: hamburger ya bottom nav
- Active page highlight karo
- Breadcrumbs for deep pages

### Forms
- Labels should be visible (not just placeholder)
- Error messages = specific, not just "Error"
- Single column forms convert better
- Min 44px input height
- Group related fields
- Show password strength indicator

---

## 5. Accessibility Guardrails ♿

- **WCAG 2.2 AA minimum** — if not sure, check with contrast checker
- **All interactive elements keyboard accessible**
- **Alt text for all images** (descriptive, not just "image")
- **ARIA labels** where semantic HTML insufficient
- **Focus indicators** visible for tab navigation
- **Don't rely solely on color** to convey info
- **Video captions** included
- **Test with screen readers** (VoiceOver, NVDA)
- **94.8% of top homepages fail WCAG** — don't be part of that statistic

---

## 6. Performance Guardrails ⚡

- **Total page weight < 2MB** (median mobile page is 2,362 KB — reduce it!)
- **Images optimized** — WebP format, lazy loading
- **JavaScript < 500KB** per page
- **Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1**
- **1-second load = 2.5x higher conversion than 5-second load**
- **48% mobile sites achieve Good CWV** — beat this benchmark

---

## 7. Design Consistency Guardrails 🎯

- **Same color palette** throughout entire website
- **Same font family** throughout (max 2)
- **Same button styles** (consistent radius, padding, hover states)
- **Same spacing rhythm** throughout
- **Same illustration/icon style** throughout
- **Design system / design tokens** use karo — Figma variables se manage karo
- **Templates** — same layout patterns repeat karo

---

## 8. Type-Specific Guardrails

### Landing Pages
- Single CTA per page (primary action)
- Hero section = headline + subtext + CTA + visual
- Social proof near CTA
- Keep form fields minimum

### Pricing Pages
- 3-4 plans max (analysis paralysis se bacho)
- "Most Popular" badge on recommended plan
- Monthly/Annual toggle with savings highlighted
- Feature comparison table with icons
- FAQ section with ~5 questions
- Mobile: stack cards vertically

### Dashboards
- Most important data = top-left (scanning pattern)
- Consistent card sizes
- Monochromatic scheme for cohesion
- Filters at top, data below

---

## 9. The "Ugly Design" Checklist

Design generate karne ke baad ye 10 questions khud se pucho:

1. [ ] Kya colors consistent hain? (max 3 primary)
2. [ ] Kya contrast WCAG AA pass karta hai? (4.5:1)
3. [ ] Kya sirf 2 fonts use hue hain?
4. [ ] Kya spacing consistent hai? (8px grid)
5. [ ] Kya mobile responsive hai? (360px test)
6. [ ] Kya CTA clear hai? (ek hi primary action)
7. [ ] Kya touch targets 44px+ hain?
8. [ ] Kya visual hierarchy clear hai? (important = big)
9. [ ] Kya loading time optimize hai?
10. [ ] Kya design brand vibe ke saath consistent hai?
