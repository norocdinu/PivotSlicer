# Pivot Slicer
### A Custom Visual for Power BI

---

## The Problem

Power BI's built-in slicers are flat. When working with hierarchical data, you can't control **what level of detail** your charts display.

For example, imagine a report with categories ("Category A", "Category B") and individual subcategories ("Subcategory 1", "Subcategory 2", "Subcategory 3"...).

With the standard slicer, you can filter to individual subcategories — but you can't easily toggle between seeing **category totals** and **individual breakdowns**.

---

## The Solution

**Pivot Slicer** is a custom visual that adds hierarchy-aware filtering to Power BI.

It displays your data as a **collapsible tree** and lets users control the level of detail they see in charts:

- Click a **category** (parent) to see its **total**
- Click an **individual item** (child) to see just **that item**
- Mix and match both in a single view

---

## How It Looks

```
  [Select All]

  v  Category A
       Category A
       Subcategory 1
       Subcategory 2
       Subcategory 3
  >  Category B
```

- The arrow expands/collapses groups
- Checkboxes show what is selected
- The tree can have multiple levels

---

## What Happens When You Click

### Selecting a category ("Category A")

The chart switches to show **one total bar** for the entire "Category A" group.

All subcategories under "Category A" appear visually checked, so it's clear what is included.

### Selecting an individual subcategory ("Subcategory 1")

The chart shows **only that subcategory's** data.

### Selecting multiple categories

Each selected category shows its own total bar. You can combine totals and individual items freely.

---

## Customization Options

The visual can be styled to match any report theme:

| Setting | What It Controls |
|---------|-----------------|
| **Slicer Settings** | Single select, multi-select with Ctrl, search bar, select all |
| **Header** | Title text, font, colors, visibility |
| **Values** | Font, colors, spacing between items |
| **Selection** | Checkbox colors, border style, hover effects |
| **Pivot** | Indent size, expand/collapse icon style, totals display |

Three icon styles are available for the expand/collapse toggle:

| Style | Collapsed | Expanded |
|-------|-----------|----------|
| Caret | > | v |
| Chevron | > (rotates) | v (rotates) |
| Plus/Minus | + | - |

---

## How It Was Built

### Step 1 — Identify the Need

The standard Power BI slicer couldn't handle the requirement of switching between summary totals and detailed breakdowns using the same filter control.

### Step 2 — Design the Data Model

We created **parameter tables** in the Power BI data model:

- **L1 table** — Contains category names ("Category A", "Category B") linked to total measure columns
- **L2 table** — Contains individual subcategories ("Subcategory 1", "Subcategory 2"...) linked to their own measure columns, **plus total rows** that match the L1 names

This structure lets a single filter column control whether the chart shows totals or details.

### Step 3 — Build the Visual

Using Microsoft's Power BI custom visuals SDK, we built:

1. A **tree view** that reads multiple category columns and arranges them as parent/child nodes
2. A **filtering engine** that sends the selected item names to other visuals on the page
3. A **formatting panel** that lets report creators customize every visual aspect

### Step 4 — Iterate and Polish

Through testing with real data, we refined:

- The cascade behavior (selecting a parent visually checks all children)
- The distinction between "Select All" (show everything) and "select all parents" (show all totals)
- The visual style to match Power BI's native look and feel

---

## Key Benefits

- **One slicer, two levels of detail** — No need for separate slicers or bookmarks to switch between totals and breakdowns
- **Familiar interaction** — Works like a standard slicer with checkboxes and search
- **Fully customizable** — Colors, fonts, icons, and spacing all adjustable in the format pane
- **Reusable** — Works with any parameter table structure, not tied to specific data

---

## What's Next

- Sync slicer support (use the same slicer across multiple report pages)
- Bookmark support (save and restore slicer state)
- Keyboard navigation and accessibility improvements

---

*Built with the Power BI Custom Visuals SDK and Claude Code*
