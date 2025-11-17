# CAD AutoScript documentation

This repository hosts the CAD AutoScript documentation portal and static utilities. The site is powered by [Docusaurus](https://docusaurus.io/) with MDX so we can mix Markdown, React, and embedded calculators.

## Run locally

`ash
npm install
npm start
`

## Build for production

`ash
npm run build
`

The static output lands in uild/ and can be deployed to GitHub Pages. A CNAME file is copied automatically so the site resolves to cadautoscript.com.

## Directory guide

- docs/ – MDX documentation (overview, catalog, embedding guide).
- log/ – Release notes (migrated welcome post documents the Docusaurus move).
- src/pages/index.tsx – Custom landing page with hero cards and telemetry.
- static/utilities/ – Legacy calculators (Pipe Cutter, Shell Rolling, etc.). They are copied verbatim during the build.

## Deploying

1. 
pm run build
2. Publish the uild/ directory (GitHub Actions or manual gh-pages push).

Happy documenting!