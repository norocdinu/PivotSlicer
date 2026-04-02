# Pivot Slicer - Custom Power BI Visual

## Overview

Pivot Slicer is a custom Power BI visual that provides hierarchical, level-aware filtering for parameter tables. It displays data in a collapsible tree view where selecting a parent category (L1) shows aggregated totals, while selecting a child item (L2) shows individual values.

## Microsoft documentation


 [Official documentation and tutorial](https://www.microsoft.com/en-us/power-platform/products/power-bi/developers/custom-visualization)


## Installation

1. Download the `.pbiviz` file from the `dist/` folder
2. In Power BI Desktop, go to **the three dots menu (...)** in the Visualizations pane
3. Select **Import a visual from a file**
4. Browse to the `.pbiviz` file and confirm

## How It Works

### Level-Aware Filtering

The slicer uses a **BasicFilter** on the deepest (last) category column in the field well. The filtering behavior depends on which level you select:

| Action | Filter Applied | Chart Shows |
|--------|---------------|-------------|
| Select L1 (e.g., "Category A") | `par_consolidated_view = "Category A"` | Total/aggregated bar |
| Select L2 (e.g., "Subcategory 1") | `par_consolidated_view = "Subcategory 1"` | Individual item bar |
| Select both L1 + L2 | `par_consolidated_view IN ("Category A", "Subcategory 1")` | Total + individual |
| Select All | Filter removed | All data |
| None selected | Filter removed | All data |

### Visual Selection Cascade

When you select an L1 parent, all its children are visually checked. This is purely cosmetic — the filter only emits the parent's name (which maps to the total row). Deselecting L1 visually unchecks all children.

### Data Model Requirements

For level-aware filtering to work, the L2 parameter table **must include total rows** that match the L1 display names. These rows should reference aggregated measure columns via `NAMEOF()`.

Example `par_consolidated_view` partition:

```dax
{
    ("Category A", NAMEOF('data'[Category A]), -1, "Category A", 0),
    ("Category B", NAMEOF('data'[Category B]), -1, "Category B", 0),
    ("Subcategory 1", NAMEOF('data'[Subcategory 1]), 0, "Category A", 1),
    ("Subcategory 2", NAMEOF('data'[Subcategory 2]), 1, "Category A", 1),
    ...
}
```

A relationship should exist between the L2 table's type column and the L1 table (Many-to-One).

## Configuration

### Field Well

| Bucket | Purpose | Notes |
|--------|---------|-------|
| **Fields** | Category columns (L1, L2, etc.) | Supports up to 10 levels |
| **Values** | Measure for totals display | Optional, max 1 |

### Formatting Options

#### Slicer Settings
- **Single select** — Only one item can be selected at a time
- **Select all** — Show/hide the "Select All" toggle
- **Multi-select with CTRL** — Require Ctrl/Cmd key to select multiple items
- **Search** — Show/hide the search bar

#### Slicer Header
- Show/hide, custom title text
- Font color, background color
- Text size, bold, italic

#### Values (Items)
- Font color, background, alternate row background
- Text size, bold, italic
- Padding (inner spacing within each item)
- Item spacing (vertical distance between items)

#### Selection Controls
- **Checkbox color** — Fill color when checked
- **Checkbox border color** — Border color when unchecked
- **Checkbox border radius** — Corner rounding (0 = square)
- Selected item background and font color
- Hover background and font color

#### Pivot (Hierarchy)
- **Indent size** — Pixels of indentation per tree level
- **Show totals** — Display aggregated values next to parent nodes
- **Expand all by default** — Start with tree fully expanded
- **Expand/collapse icon** — Choose between Caret, Chevron, or Plus/Minus
- **Total label** — Custom label for total display

## Building from Source

### Prerequisites
- Node.js (managed via fnm)
- Power BI Visual Tools (`pbiviz`)

### Build Command

```bash
export PATH="$HOME/.local/share/fnm:$PATH" && eval "$(fnm env --shell bash)"
npx pbiviz package
```

The output `.pbiviz` file will be in the `dist/` folder.

## Project Structure

```
hierarchySlicer/
  src/
    visual.ts       # Main visual logic (tree, filtering, rendering)
    settings.ts     # Formatting settings model
  style/
    visual.less     # Styles (Fluent UI palette)
  capabilities.json # Data roles, objects, data view mappings
  pbiviz.json       # Visual metadata and GUID
  assets/
    icon.svg        # Visual icon
```

## Known Limitations

- Sync slicer not yet supported
- Bookmarks not yet supported
- No keyboard navigation or high-contrast mode
- No context menu or tooltip support
