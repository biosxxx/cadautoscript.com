---
slug: cad-autoscript-docusaurus
title: Migrated CAD AutoScript to Docusaurus
authors: [biosxxx]
tags: [release, docusaurus, chromium]
---

We just replaced the hand-authored HTML landing page with a full Docusaurus wiki. The new stack unlocks MDX embeds, versioned docs, built-in search, and dark/light themes for free.
<!-- truncate -->

## Highlights

- **Docusaurus classic template** with a custom hero, telemetry panel, and catalog cards.
- **Utility catalog docs** that link directly to /utilities/* SPAs, so engineers can read specs and launch tools without leaving the page.
- **MDX embedding guide** that shows how to wrap calculators as React components or inline iframes.
- **Static folder migration** so legacy calculators (Pipe Cutter, Shell Rolling, QR tags, etc.) still deploy verbatim.

## What to do next

1. Write doc pages for any missing macros or calculators.
2. Convert older calculators to React components so they can be embedded without an iframe.
3. Use the blog to publish release notes whenever a tool changes behavior or receives new inputs.

Enjoy the faster workflow! The 
pm run start dev server reloads instantly, so editing docs is finally painless.
