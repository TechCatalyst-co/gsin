---
name: Global Super Intelligence News (GSIN)
description: A free, global wire for artificial intelligence and the road to superintelligence.
colors:
  paper: "#f1f3f7"
  surface: "#ffffff"
  ink: "#10153a"
  ink-2: "#3a4064"
  slate: "#5d6482"
  line: "#d9dce7"
  line-strong: "#b9bed0"
  signal: "#3b3bf5"
  signal-ink: "#ffffff"
  signal-soft: "#e4e4ff"
  flare: "#e5391b"
  flare-soft: "#fde8e3"
  ok: "#15803d"
  ink-0: "#0d1030"
  ink-1: "#151a42"
  ink-2a: "#1d2350"
  ink-rule: "#2a3166"
  on-ink: "#eceefb"
  on-ink-2: "#b9bee0"
  on-ink-3: "#8e94bf"
  sig: "#8f8fff"
  hot: "#ff6a4d"
  desk-frontier-models: "#3B3BF5"
  desk-research: "#0E8F86"
  desk-safety-alignment: "#C2410C"
  desk-policy-regulation: "#7C3AED"
  desk-industry-funding: "#B45309"
  desk-compute-hardware: "#475569"
  desk-open-source: "#15803D"
  desk-superintelligence: "#BE185D"
  desk-robotics: "#0369A1"
  desk-neutral: "#8A90A8"
typography:
  display:
    fontFamily: "'Bricolage Grotesque Variable', 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(40px, 5.1vw, 74px)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 74"
  headline-section:
    fontFamily: "'Bricolage Grotesque Variable', 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(44px, 5.4vw, 84px)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 76"
  headline-lead:
    fontFamily: "'Bricolage Grotesque Variable', 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(34px, 5.2vw, 64px)"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 80"
  headline-story:
    fontFamily: "'Bricolage Grotesque Variable', 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "clamp(32px, 5vw, 54px)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 82"
  title:
    fontFamily: "'Bricolage Grotesque Variable', 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.2
  body-read:
    fontFamily: "'Newsreader Variable', 'Newsreader', Georgia, 'Times New Roman', serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.65
  dek:
    fontFamily: "'Newsreader Variable', 'Newsreader', Georgia, 'Times New Roman', serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  body-ui:
    fontFamily: "'Bricolage Grotesque Variable', 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'Bricolage Grotesque Variable', 'Bricolage Grotesque', 'Helvetica Neue', Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
rounded:
  flag: "4px"
  radius-s: "6px"
  radius-m: "12px"
  pill: "999px"
spacing:
  gutter: "16px"
  page-end: "64px"
  landing-section: "clamp(56px, 9vw, 112px)"
components:
  button-primary:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "42px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "42px"
  button-ghost-on:
    backgroundColor: "{colors.signal-soft}"
    textColor: "{colors.ink}"
  button-small:
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "34px"
  button-landing-primary:
    backgroundColor: "{colors.sig}"
    textColor: "{colors.ink-0}"
    rounded: "{rounded.pill}"
    padding: "0 26px"
    height: "54px"
  button-landing-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "0 26px"
    height: "54px"
  desk-pill:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
  desk-pill-active:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
  tag-chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  sort-chip-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  flag-breaking:
    backgroundColor: "{colors.flare}"
    textColor: "#ffffff"
    rounded: "{rounded.flag}"
    padding: "1px 8px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius-s}"
    padding: "8px 12px"
    height: "42px"
  input-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "36px"
  card-surface:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.radius-m}"
    padding: "24px"
  brief-promo:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.radius-m}"
    padding: "24px"
---

# Design System: Global Super Intelligence News (GSIN)

## Overview

**Creative North Star: "The Clean-Room Wire"**

GSIN reads like a wire service printed in a clean room: cool blue-grey paper, deep indigo ink, one electric ultramarine for signal, and a flare red that only fires for breaking news. Headlines and interface speak in Bricolage Grotesque, pushed heavy and condensed through its width axis; anything meant to be read at length (deks, story bodies, the brief, promo copy) switches to Newsreader. The signature is the GSIN lockup: an exponential curve leaving its axis, landing on a flare dot.

The newsroom itself is dense and flat. Stories are rows separated by hairlines, not cards; surfaces are white panels on paper with soft 12px corners; controls are pills. Depth comes from tone (paper, surface, ink) rather than shadow. Dark mode is a full token swap on the same roles, into the ink field.

The landing page at `/` extends this world rather than replacing it. Its hero is pinned to the ink field regardless of colour scheme, using the dark-mode values as landing-scoped constants, and the page steps down section by section: ink hero, deeper-ink desk index, paper brief, surface close, then the standard footer. The curve glyph is drawn large and animates in; the wire column is real, timestamped, and re-polls.

**Key Characteristics:**
- Cool paper, indigo ink, single ultramarine signal, flare red reserved for breaking and the curve's dot.
- Bricolage Grotesque at 800 with a narrowed width axis (72 to 85) for every display size; Newsreader for reading text.
- Hairline rules (1px) and tonal steps for structure; shadows only as state feedback.
- Pills for every control and chip; 6px and 12px for fields and panels.
- Desk colour dots as the only multi-hue element.

## Colors

A cool, near-monochrome indigo system with one saturated ultramarine and one emergency red; the nine desk hues appear only as small dots.

### Primary
- **Electric Ultramarine** (signal): links on hover, primary buttons, focus rings, ranked-list numerals, brief item numerals, chart bars, the lockup's curve and rule. Swaps to Periwinkle Signal in dark mode. Text on it uses signal-ink.
- **Signal Wash** (signal-soft): selected ghost buttons, soft alerts, the comment sign-in gate, credential boxes.

### Secondary
- **Flare Red** (flare): the breaking banner, the "Breaking" flag, destructive text, error alerts, the lockup's dot. Never decorative.
- **Flare Wash** (flare-soft): error and stale-pipeline backgrounds, warning badges.
- **Newsroom Green** (ok): active badges and the healthy-pipeline note only, always mixed down to a 14 to 16% tint behind green text.

### Neutral
- **Clean-Room Paper** (paper): page background; also the hover fill for desk pills and the nested-comment fill.
- **Surface White** (surface): masthead, footer, cards, inputs, tables.
- **Indigo Ink** (ink): primary text; also the filled state of desk pills, sort chips, topic toggles, and the brief promo panel.
- **Ink Two** (ink-2): deks, secondary links, desk labels.
- **Slate** (slate): metadata, dates, section headings, table headers.
- **Hairline** (line) and **Strong Hairline** (line-strong): row dividers and panel borders; field and ghost-button strokes.

### The landing ink field
Scoped to the landing hero and desk index. ink-0, ink-1, sig and hot carry the same values as the dark-mode paper, surface, signal and flare, so the hero looks identical in both schemes.
- **Field Ink** (ink-0): the hero background and the text colour on periwinkle buttons and flags.
- **Deep Ink** (ink-1): the nine-desks section.
- **Lifted Ink** (ink-2a): desk-cell hover and skeleton bars.
- **Ink Rule** (ink-rule): every hairline on ink, the curve's axis, quiet-link underlines.
- **On-Ink, On-Ink Two, On-Ink Three** (on-ink, on-ink-2, on-ink-3): headline, promise and nav, metadata and counts.
- **Periwinkle Signal** (sig): signal on ink; primary button, live pulse, wire links, selection.
- **Hot Flare** (hot): the curve's dot and the Breaking flag on ink.

### Desk hues
Nine fixed hues plus a neutral for unknown desks, defined in `client/src/brand.js` and applied inline to 9px (11px on the landing index, 18px on topic heads) circular dots beside the desk name. They never fill surfaces, text or buttons.

### Named Rules
**The Reserved Flare Rule.** Flare red means breaking news or an error. The only decorative exception is the curve glyph's dot, which is part of the brand mark.

**The Single Signal Rule.** One accent per scheme: ultramarine on paper, periwinkle on ink. Do not introduce a second accent hue; desk colours stay at dot size.

**The Pinned Ink Rule.** The landing hero and desk index stay on ink in both colour schemes; everything below them follows the scheme tokens.

## Typography

**Display Font:** Bricolage Grotesque Variable (with Helvetica Neue, Arial, sans-serif), self-hosted via @fontsource-variable
**Body Font:** Newsreader Variable, optical-size axis (with Georgia, Times New Roman, serif), self-hosted via @fontsource-variable
**UI Font:** Bricolage Grotesque, the body default

**Character:** A wide-ranging grotesque squeezed narrow and heavy for headlines gives the wire its urgency; a newspaper serif with optical sizing gives the reading text its calm. Bricolage is the page's default face; Newsreader is opted into wherever prose is meant to be read.

### Hierarchy
- **Display** (800, clamp 40 to 74px, line-height 0.9, wdth 74): the landing hero's full-name lockup only, "Global Super" / "Intelligence News" on two lines beside the curve glyph (1.75em square) with a 2px signal rule between them. The name always leads; the GSIN abbreviation is introduced in the promise line beneath it and used in the top bar.
- **Headline, section** (800, clamp 44 to 84px, 0.92, wdth 76): landing section heads. The close uses a smaller step (clamp 36 to 64px, wdth 78).
- **Headline, lead** (800, clamp 34 to 64px, 0.98, wdth 80): the newsroom lead story.
- **Headline, story / page** (800, clamp 32 to 54px, wdth 82): story titles; feed heads use clamp 30 to 46px at wdth 85, the brief head clamp 36 to 56px at wdth 78.
- **Title** (700, 21px, 1.2): story rows and brief items; 17px in compact rows, 19px on mobile.
- **Body, read** (Newsreader 400, 20px, 1.65): story bodies, capped by the 780px story column. Legal text uses 18px.
- **Dek** (Newsreader 400, 17px, 1.5): row deks capped at 40em; lead dek 21px, story dek 23px, brief summary 23px.
- **Body, UI** (Bricolage 400, 16px, 1.5): interface default.
- **Label** (600, 14px): form labels, meta rows, chips. Section headings are 15px 700 in slate, sentence case.

### Named Rules
**The Width Axis Rule.** Every heavy headline is narrowed through `font-variation-settings: 'wdth'` (paired with `font-stretch`), from 72 at the largest size up to 85 at feed heads. Larger type is narrower.

**The Two Voices Rule.** Bricolage for anything scanned, Newsreader for anything read. A dek, summary or paragraph of prose is set in Newsreader even inside a UI panel.

**The Sentence Case Rule.** Headings and labels are sentence case. The only uppercase tracked label in the build is the landing's "Live on the wire" column head; it is not a general label style.

## Layout

A 1180px shell with 16px gutters. The newsroom front is a lead (1.25fr / 1fr, image right) over a two-column body (fluid main, 320px sidebar, 48px gap). Reading pages are a single 780px column; the brief is 820px; legal and narrow pages 760px. Story lists are stacked rows with a 1px bottom rule and 20px vertical padding, thumbnail (168px, 16:10) on the right.

The landing uses full-bleed bands inside the same shell: a hero at min(100svh, 980px) split 1.25fr / 1fr with the wire column ruled off on the left; a 0.8fr / 2fr desk section whose index is a 3-column grid of hairline-ruled cells; a 1.7fr / 1fr brief; a 1.2fr / 1fr close. Landing gaps and section padding scale with clamp().

Spacing is a loose 4px-based rhythm (4, 6, 8, 12, 16, 20, 24, 28, 32, 40, 48, 64) with no spacing tokens beyond the gutter; pages end on 64px.

Breakpoints: at 1000px the front and every landing grid collapse to one column (desk index to two); at 760px the masthead swaps search and account for a menu button, desk pills become a vertical drawer, row thumbnails hide, and type steps down; at 560px landing buttons go full width and the desk index goes to one column.

## Elevation & Depth

Flat, layered by tone. Paper sits under white surfaces; ink panels (brief promo, landing hero, desk index) are the deepest layer. Panels carry either a 1px hairline or nothing; none carries a resting shadow.

### Shadow Vocabulary
- **Signal glow** (`box-shadow: 0 10px 30px -10px rgba(143, 143, 255, 0.55)`): hover on the landing primary button on ink.
- **Ink glow** (`box-shadow: 0 10px 30px -12px color-mix(in srgb, var(--ink) 60%, transparent)`): hover on the landing ink button.
- **Pulse ring** (animated `0 0 0 0` to `0 0 0 10px`, fading): the breaking banner's white pulse and the landing's periwinkle live dot.

### Named Rules
**The Flat-At-Rest Rule.** Nothing has a shadow at rest. Shadows appear only as hover feedback on the landing's large buttons or as a live pulse.

## Shapes

Three corner families. Every control and chip is a full pill (999px): buttons, desk pills, sort chips, tags, topic toggles, badges, search fields, the mobile menu button, admin row actions. Fields, selects, alerts and textareas use 6px. Panels and media (cards, analysis, auth card, lead and story images, stat tiles) use 12px; row thumbnails use 6px. Breaking flags and inline code are 4px. Live dots, desk dots and the back-to-top button are circles.

Lines are hairlines: 1px solid for structure, 1px dashed (line-strong) for placeholder states (locked analysis, ad previews). The 2px weight appears on the masthead lockup's signal rule and the landing lockup's, nested-comment threads, and the landing brief's call-to-action rule.

## Components

### Buttons
Confident, rounded, unadorned.
- **Shape:** full pill (999px), 42px tall, 600 weight at 15px; small variant 34px at 14px.
- **Primary:** signal fill, signal-ink text; hover brightens (`filter: brightness(1.08)`).
- **Ghost:** transparent with a line-strong stroke; hover darkens the stroke to ink; the selected state fills with signal-soft and a signal stroke.
- **Focus:** global 2px signal outline, 2px offset.
- **Disabled:** 55% opacity.
- **Text link button:** no chrome, ink-2 text, signal on hover or when active.
- **Landing scale:** 54px tall, 26px padding, 700 at 17px, with an inline arrow that slides 4px right on hover (.35s, `cubic-bezier(.16,1,.3,1)`). Primary on ink is periwinkle on field ink; on paper it reverts to signal. The quiet variant is underlined text with an ink-rule underline that turns periwinkle on hover. The ink variant fills with ink on paper.

### Chips
- **Desk pills:** ink-2 text, paper fill on hover, ink fill with paper text when active; the Daily Brief pill is signal text at 700.
- **Tags:** surface fill, hairline stroke, 14px.
- **Sorts and topic toggles:** surface with hairline stroke; on, they fill ink with paper text.
- **Badges:** 12px pills; staff badges fill signal, active badges tint green, warnings tint flare.
- **Breaking flag:** flare fill, white 700 text at 12px, 4px corners. On ink it becomes hot with field-ink text.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** surface on paper; nested comments drop back to paper.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** a 1px hairline on forms, key-value lists, stats and tables; none on analysis and comments.
- **Internal Padding:** 16px for compact tiles and comments, 24px for panels, 32px for the auth card.
- **Brief promo:** an ink panel with paper text and Newsreader copy at 80% paper.

### Inputs / Fields
- **Style:** surface fill, line-strong 1px stroke, 6px corners, 42px minimum height, 8px 12px padding. Comment textareas set their text in Newsreader at 17px.
- **Search:** pill-shaped, 36px tall (38px in admin), paper or surface fill.
- **Focus:** the global 2px signal outline.
- **Error:** a flare-soft alert block with flare text above the form.

### Navigation
- **Masthead:** surface band with a hairline bottom rule. The top row holds the lockup, date (slate, 14px), pill search, and account links; a second row, separated by a hairline, scrolls desk pills horizontally with the scrollbar hidden. Under 760px the desk row becomes a toggled vertical drawer holding search and account.
- **Landing bar:** on ink, a condensed 800 GSIN text mark at 24px left, nav links in on-ink-2 at 600 / 15px right, on-ink on hover.
- **Footer:** surface band, hairline top rule, 1.4fr / 1fr / 1fr grid, Newsreader tagline, slate fine print, "Powered by TechCatalyst".

### Story Row
The newsroom's base unit: a meta line (desk dot and name, source, time) in 14px slate, a 21px 700 title, a Newsreader dek, and an optional right-hand thumbnail, closed by a hairline. In editors' picks the same row becomes a 12px surface tile.

### The Lockup
Curve glyph (a line-strong axis, a 3px signal curve with a round cap, a flare dot), then GSIN at 800, 30px, wdth 75, then the full name in two lines at 12.5px beside a 2px signal rule. On the landing the glyph is drawn large on ink (ink-rule axis, periwinkle curve, hot dot); the curve draws itself over 1.3s and the dot scales in at 1s. Both animations run only when `prefers-reduced-motion` allows.

### The Wire Column
The landing's live list: a ruled-off column headed by a periwinkle pulse and "Live on the wire", with a tabular-numeral checked time. Each row shows the local time (600, tabular), desk dot and name, an optional hot Breaking flag, and a title clamped to 3 lines, divided by ink-rule hairlines. On first load rows file in staggered by 70ms; stories that arrive on a later 60-second poll slide in with a fading periwinkle wash. While loading, ink-2a skeleton bars stand in for the rows.

### Numbered Lists
Brief items and the landing brief number themselves with an 800 condensed (wdth 75) signal numeral at 28 to 30px; ranked sidebar lists use a signal 800 marker.

## Do's and Don'ts

### Do:
- **Do** use signal for every interactive accent and focus ring, and periwinkle (sig) for the same jobs on ink.
- **Do** set headlines in Bricolage 800 with a narrowed `'wdth'` axis (72 to 85), tightening letter-spacing to -0.02em or -0.025em at the largest sizes.
- **Do** set deks, summaries and story bodies in Newsreader, and keep reading measures to the established caps (36 to 40em for deks, a 780px story column).
- **Do** separate list items with 1px hairlines (line on paper, ink-rule on ink) rather than boxing them.
- **Do** make every control and chip a full pill (999px), fields 6px, panels 12px.
- **Do** tag stories with the desk colour dot from `brand.js`, never with a colour fill.
- **Do** gate decorative motion behind `prefers-reduced-motion: no-preference`, using `cubic-bezier(.16,1,.3,1)` for entrances.

### Don't:
- **Don't** use flare red for anything but breaking news, errors, destructive actions, and the curve's dot.
- **Don't** add resting shadows to cards or panels; depth comes from paper, surface and ink.
- **Don't** introduce a second accent hue or enlarge desk hues beyond dot size.
- **Don't** let the landing hero follow the colour scheme; it stays on the ink field.
- **Don't** mark callouts or cards with a coloured side stripe; the lockup's 2px signal rule is the only coloured side rule in the system. The story's "Why it matters" block (4px signal left border) and the staff-comment inset bar (3px) predate this record and are known drift, not patterns to copy.
