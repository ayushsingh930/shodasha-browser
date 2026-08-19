# Design Psychology & Knowledge Resources

## How to Use This File

This file gives you the deep design knowledge that separates great products from merely functional ones. Read the relevant section **before** designing any feature, not after. Each resource serves a specific purpose:

1. **NameThatUI** — Translate vague user descriptions into precise component names
2. **Product Design Psychology** — Understand user psychology and cognitive biases
3. **DesignSystems.com** — Learn design system best practices from industry leaders

---

## 1. NameThatUI — The Visual Dictionary of UI

**URL:** https://namethatui.com/

**Purpose:** Users (and even you) often describe UI elements in vague, imprecise terms. This site translates those descriptions into exact component names, API symbols, and paste-ready prompts for your coding tool.

### When to Use

| User Says Something Like… | What You Find | The Real Name |
|---------------------------|---------------|---------------|
| "the gray text inside the box that disappears when you type" | → | Placeholder |
| "the dots under the slideshow" | → | Carousel Indicators (Dots) |
| "the dark see-through layer behind a popup" | → | Scrim / Backdrop |
| "the text gets cut off with three dots" | → | Truncation (Ellipsis) |
| "the bar that stays when I scroll" | → | Sticky Header |
| "the three lines that open a menu" | → | Hamburger Menu |
| "the little calendar that pops up" | → | Date Picker |
| "the dot you drag to change the volume" | → | Slider Thumb |

### Protocol

1. The user describes a UI element in their own words
2. **Go to** https://namethatui.com/ and describe it in natural language
3. Identify the correct component name (e.g., "Scrim", not "the dark thing behind")
4. Use the real name in your prompts, code, and file names
5. Reference the correct ARIA attribute or HTML element listed on the site

---

## 2. Product Design Psychology

**URL:** https://productdesignpsychology.com/

**Author:** Wouter de Bres

**Purpose:** A full book on the psychology of design — understanding the minds you're designing for AND the mind you're designing with. This makes you think like a senior designer who creates products people love, not just UI that looks good.

### Core Sections

| Section | What It Covers | Why It Matters |
|---------|---------------|----------------|
| **The Designer's Mind** (ch. 0–10) | How your own psychology — ego, bias, knowledge, deadlines — warps your design decisions | Prevents you from designing for yourself instead of the user |
| **Minding the Design** (ch. 11–20) | How interface mechanics shape perception: vibes, affordances, cognitive load, patterns, progress | Makes your UI feel intuitive, not exhausting |
| **The User's Mind** (ch. 21–30) | What users bring psychologically: they don't think in tasks, want everything now, lie to you, resist change | Makes your product actually work for real humans |
| **The Organization's Mind** (ch. 31–40) | How meetings, metrics, roadmaps, and politics kill good design | Helps you ship great work despite organizational friction |

### Key Principles to Apply

- **"Nobody Remembers Your UI" (ch. 17)** — users don't memorize your interface. Design for recognition, not recall
- **"Design the Last Moment First" (ch. 18)** — start with the user's goal, not your component hierarchy
- **"Fake Progress Is Real Motivation" (ch. 19)** — show progress indicators, break forms into steps, celebrate completions
- **"Layout Speaks Before You Do" (ch. 20)** — visual hierarchy communicates priority before a single word is read
- **"More Options Make Users Quit" (ch. 28)** — fewer choices = more conversions
- **"Your Design Made Them Quit" (ch. 30)** — if users leave, it's your design's fault, not theirs

### When to Read

- **Before any feature design:** Read "Nobody Remembers Your UI" and "Design the Last Moment First"
- **Before building forms or checkout:** Read "Fake Progress Is Real Motivation" and "More Options Make Users Quit"
- **Before redesigning existing UI:** Read "Users Will Hate Your New Design" — learn how to migrate gracefully
- **When a feature feels complex:** Read "Your UI Is Exhausting" to identify cognitive load issues
- **When you're frustrated with stakeholder feedback:** Read the entire "Organization's Mind" section

---

## 3. DesignSystems.com

**URL:** https://www.designsystems.com/

**Publisher:** Figma

**Purpose:** A publication covering everything about design systems — from foundational guides to advanced operations. Reference this when you need to understand how professional teams structure, maintain, and evolve their design systems.

### Key Sections

| Section | Content | Best For |
|---------|---------|----------|
| **Getting Started** | Grids, layouts, iconography, typography, content strategy | Setting up the project's design foundation |
| **Design & Development** | Case studies from Spotify, behavioral science, design tokens | Understanding how design systems evolve |
| **Operations** | Contribution models, compliance, governance | Scaling the design system across a team |
| **Schema by Figma** | Conference talks on design systems | Inspiration and industry patterns |

### How to Reference

- **Before choosing fonts:** Read the Typography guide
- **Before building a component library:** Read "A collaborative approach to defining components"
- **Before setting up design tokens:** Read "The future of design systems is semantic"
- **When the design system needs governance:** Read "Keeping design system contributions in check"
- **For accessibility:** Read "The future of design systems is accessible"

---

## Usage Summary

| Resource | When to Reach For It | What It Gives You |
|----------|---------------------|-------------------|
| namethatui.com | User describes UI vaguely | Exact component name + ARIA + prompt |
| productdesignpsychology.com | Before any feature design | Psychological principles for lovable products |
| designsystems.com | Setting up structure/tokens | Best practices from industry leaders |