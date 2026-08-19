---
name: sitemap
description: >
  Use ONLY when creating or deriving the sitemap / information architecture of a
  product: pages, routes, hierarchy, navigation groups, public vs authenticated
  areas, and API surface overview. Produces a complete site map BEFORE any code so
  the AI never invents pages mid-build. Do NOT use for user journeys (see user-flows),
  UI styling, or folder structure (see folder-structure).
trigger: >
  User says "make a sitemap", "what pages should we have", "map out the site",
  "structure the website/app", "information architecture", or before starting any new
  project or major feature set.
avoid_trigger: >
  Visual design, colors, folder structure, request/response diagrams (user-flows
  skill), security, performance.
---

# Sitemap Skill — Map the Whole Product Before You Build

## Purpose

The AI's worst habit: building page-by-page with no map, inventing new pages late,
missing screens entirely. A sitemap fixes the full surface of the product first:
every page, every route, every group, every access level. If it's not on the map, it
doesn't get built.

## When to Use

- New project kickoff — map the site before any code
- User asks "what should this app contain?"
- Before adding a major section (e.g., adding billing → map billing pages first)
- Auditing an existing app for missing pages

## Workflow

### Step 1 — Gather Product Context

Read `context/project-overview.md` and ask the user:

1. What are the **primary user goals**? (buy, read, manage, communicate...)
2. Who are the **user types**? (guest, customer, admin, vendor...)
3. What **content/features** exist? (product listing, dashboard, settings...)
4. What's **public vs authenticated**? What's **role-gated**?

### Step 2 — Derive the Page Universe

List every page needed to satisfy the goals. Use this checklist of common areas and
mark what applies (not everything applies to every product):

| Area | Typical Pages |
|------|---------------|
| Marketing | Home, About, Pricing, Blog, Blog Post, Careers, Contact, FAQ, Terms, Privacy |
| Auth | Login, Register, Forgot Password, Reset Password, Verify Email, 2FA |
| Core | Dashboard, List views, Detail views, Search results |
| Billing | Plans, Billing/Payment Methods, Invoices, Checkout, Success, Cancel |
| Account | Profile, Settings, Notifications, Security, Sessions, Delete Account |
| Admin | Overview, Users, Content, Audit Logs, Feature Flags |
| Utility | 404, 500, Offline, Maintenance, Empty states |

### Step 3 — Build the Hierarchy (Not a Flat List)

Group pages by **navigation structure + access level**:

- Top-level navigation groups
- Nested sections
- Auth-required vs public
- Role-gated (admin only)

### Step 4 — Produce the Sitemap (Deliverable)

Output BOTH an ASCII tree (for quick reading) and a Mermaid diagram (for sharing):

**ASCII:**
```
/                                  # public
├── /pricing
├── /blog
│   └── /blog/[slug]
├── /login
├── /register
└── /app                            # authenticated
    ├── /app/dashboard
    ├── /app/surveys                # (auth: user)
    ├── /app/surveys/[id]
    ├── /app/settings
    └── /app/admin                   # (auth: admin)
        └── /app/admin/users
```

**Mermaid:**
```mermaid
graph TD
    A[/] --> B[/pricing/]
    A --> C[/blog/]
    C --> D[/blog/:slug/]
    A --> E[/login/]
    A --> F[/register/]
    A --> G[/app/]
    G --> H[/app/dashboard/]
    G --> I[/app/surveys/]
    I --> J[/app/surveys/:id/]
```

### Step 5 — Annotate the Map

For every node, note:

- **Access level**: public / auth / role
- **Data dependency**: what API/entity does it need? (e.g., `/app/surveys` needs `GET /surveys`)
- **State**: what happens when empty, loading, error (see `States.md`)
- **Entry points**: how users arrive (nav, CTA, email link, redirect)

### Step 6 — Approve & Persist

1. Present the map to the user and get approval BEFORE building
2. Save to `docs/sitemap.md` (or the feature spec) — the map is a living document
3. Update it whenever the site changes

## Rules

1. **No page exists that isn't on the map.** If the AI is about to create a route that isn't on the map, stop and update the map first.
2. **Every user goal maps to at least one page path.**
3. **Access levels are explicit** — never "everyone can see this page" by default.
4. **Error/utility pages exist by design**: 404, error state, empty state.
5. **API surface is derivable from the map** — each data-backed page implies endpoints.
6. **Size the map to the product.** A portfolio site has no billing pages; a simple
   tool has no admin section. Only include pages the product's actual scope calls for —
   never invent an "admin panel" or "billing" because the template has one.
7. **Pages come from requirements, not from checklists.** The `areas.md` list is a
   menu to choose from, not a mandate to implement everything.

## Files in This Skill

```
sitemap/
├── SKILL.md              ← this file (entry point)
└── references/
    └── areas.md          ← page universe by product area (checklists)
```

## Handoff

- User journeys through these pages → `user-flows` skill
- Folder structure for the pages → `folder-structure` skill
- Security of gated areas → `ssdlc` skill
