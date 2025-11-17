---
sidebar_position: 2
title: Utility catalog
---

import Link from "@docusaurus/Link";

Each web utility ships with its own static bundle under `/utilities/*`. Link to them from anywhere in MDX or embed them as React components.

| Utility | Description | Standards | Launch |
| --- | --- | --- | --- |
| **Pipe Cutter Visualizer** | Interactively trim two pipes, tune offsets, and export DXF saddle templates. | ASME B31.3 / ISO 9606 | <Link to="/utilities/pipe-cutter/">Launch</Link> |
| **Cylindrical Shell Rolling** | Calculate roll spacing, bending allowance, and shop offsets for cylindrical shells. | EN 13445 / ASME VIII | <Link to="/utilities/cylindrical-shell-rolling/">Launch</Link> |
| **Sheet-metal bending sandbox** | Simulate K-factors, reliefs, and bend deductions before programming CAM. | ISO 2768 / EN 10149 | <Link to="/utilities/metal-bending/">Launch</Link> |
| **Interactive thread atlas** | Browse ISO/UNC/UNF tables, check drill diameters, and copy callouts. | ISO 965 / UNC / UNF | <Link to="/utilities/interactive-thread/">Launch</Link> |
| **PDF number extractor** | Parse QA PDFs locally, highlight serials, and export CSV snapshots. | Offline parsing | <Link to="/utilities/pdf-number-extractor/">Launch</Link> |
| **QR nameplate generator** | Build branded QR/serial plates with safety icons—and export SVG/PNG instantly. | ISO 3864 · Traceability | <Link to="/utilities/qr-nameplate/">Launch</Link> |

## Versioning & telemetry

- Utilities are static builds copied from `static/utilities/*`. Update the React code in a dedicated repo, then drop the output here.
- Include a `CHANGELOG.md` next to each utility when possible so shop-floor teams can track behavior changes.
- Use browser devtools or custom logging endpoints if you need telemetry—utilities are standalone SPAs.

## Surface utilities inside docs

You can embed a calculator inline with MDX:

```mdx
import PipeCutter from '@site/static/utilities/pipe-cutter/index.html';

<iframe src="/utilities/pipe-cutter/" title="Pipe Cutter" className="utilityFrame" />
```

Add custom CSS for `.utilityFrame` in `src/css/custom.css` if you want consistent framing.
