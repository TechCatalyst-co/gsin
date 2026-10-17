# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(The Flutter app in `mobile/` is a separate client with its own conventions; it opens on the Daily Brief.)

## Users
Curious readers who follow AI news in general and want to keep up with the road to superintelligence without wading through every lab blog, paper and press release. Staff editors and admins curate the feed and moderate discussions.

## Product Purpose
Global Super Intelligence News (GSIN) is a free news outlet for artificial intelligence and the road to superintelligence. An automated n8n pipeline gathers stories from RSS, arXiv and lab blogs, summarizes them with an LLM, and editors curate the result. Success: a visitor lands, sees the newsroom is alive, enters it, and signs up for the free Daily Brief email.

## Positioning
A single, global wire dedicated to AI and superintelligence: every story summarized with "why it matters", organized into nine desks, and condensed each morning into the Daily Brief. Entirely free; no paywall.

## Operating Context
Readers arrive on the web (and the iOS/Android app). They scan the front page ("the newsroom"), read stories and the Daily Brief, follow topics, save stories, and discuss. Breaking items are flagged and pushed to the app.

## Capabilities and Constraints
- Every story, analysis, topic pages, search, RSS and the Daily Brief are free with no account.
- A free account adds discussions, saved stories, followed topics ("For you"), and the Daily Brief by email (on by default).
- Breaking-news push alerts in the app, per device.
- Desks: Frontier Models, Research, Safety & Alignment, Policy & Regulation, Industry & Funding, Compute & Hardware, Open Source, Superintelligence, Robotics.
- Ad slots exist but are switched off until configured.
- Stories are machine-summarized then curated; readers are told to check the original source.

## Brand Commitments
- Name: Global Super Intelligence News, short form GSIN. Lockup with the exponential-curve glyph (`client/src/components/Wordmark.jsx`).
- Operated by Sirlopu Technology Services, LLC (dba TechCatalyst); footer carries "Powered by TechCatalyst".

## Evidence on Hand
Live stories, the Daily Brief, desk counts and trending tags come from the API (`/api/v1/news/front-page`, `/news/tags`, `/daily-brief`). There are no reader counts, testimonials, press mentions or subscriber numbers; do not invent them.

## Product Principles
- Free, always: never imply a paywall or premium tier.
- Show the wire working rather than describing it.
- Summaries serve the original source; credit and link it.
- Calm signal over hype: breaking is reserved for real breaking news.
