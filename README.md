# Pivot Slicer

A custom Power BI visual that provides hierarchical, level-aware filtering for parameter tables. Select a parent category to see totals, or drill into individual items — all from a single slicer.

## Features

- **Level-aware filtering** — L1 selections show aggregated totals, L2 selections show individual items
- **Collapsible tree view** — Expand/collapse groups with configurable icon styles (caret, chevron, plus/minus)
- **Visual cascade** — Selecting a parent visually checks all children
- **Search** — Filter items by name
- **Multi-select modes** — Free multi-select, single select, or multi-select with CTRL
- **Fully customizable** — Header, items, checkboxes, colors, spacing, and more from the format pane
- **Native look** — Styled to match the default Power BI slicer (Fluent UI)

## Installation

1. Download the latest `.pbiviz` file from [`dist/`](dist/)
2. In Power BI Desktop, click **...** in the Visualizations pane
3. Select **Import a visual from a file**
4. Browse to the `.pbiviz` file

## How It Works

Drag your hierarchy columns into the **Fields** bucket (L1 first, L2 second). Optionally add a measure to the **Values** bucket to display totals.

| Selection | Result |
|-----------|--------|
| L1 parent (e.g., "Category A") | Chart shows category total |
| L2 child (e.g., "Subcategory 1") | Chart shows individual item |
| Multiple L1 + L2 | Chart shows mix of totals and items |
| Select All | Filter cleared, all data shown |

### Data Model Requirement

The L2 parameter table must include **total rows** matching the L1 display names, referencing aggregated measure columns via `NAMEOF()`. See [DOCUMENTATION.md](DOCUMENTATION.md) for details.

## Building from Source

Requires Node.js (via [fnm](https://github.com/Schniz/fnm)):

```bash
npm install
npx pbiviz package
```

Output: `dist/pivotSlicerDD92AEBC9F544C79A3D5092006B34E2F.1.0.0.0.pbiviz`

## Documentation

- [DOCUMENTATION.md](DOCUMENTATION.md) — Full technical reference
- [PRESENTATION.md](PRESENTATION.md) — Non-technical overview of the visual and how it was built

## License

Private project.
