"use strict";

import powerbi from "powerbi-visuals-api";
import { FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import { VisualFormattingSettingsModel } from "./settings";
import * as models from "powerbi-models";
import "./../style/visual.less";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;
import DataView = powerbi.DataView;
import DataViewCategoryColumn = powerbi.DataViewCategoryColumn;
import FilterAction = powerbi.FilterAction;

interface HierarchyNode {
    id: string;
    displayName: string;
    level: number;
    value: number | null;
    children: HierarchyNode[];
    isExpanded: boolean;
    isSelected: boolean;
    path: string[];
    rowIndices: number[];
}

export class Visual implements IVisual {
    private host: IVisualHost;
    private target: HTMLElement;
    private container: HTMLElement;
    private headerEl: HTMLElement;
    private searchEl: HTMLInputElement;
    private searchContainer: HTMLElement;
    private listEl: HTMLElement;
    private selectAllEl: HTMLElement;

    private formattingSettings: VisualFormattingSettingsModel;
    private formattingSettingsService: FormattingSettingsService;

    private rootNodes: HierarchyNode[] = [];
    private categories: DataViewCategoryColumn[] = [];
    private measureValues: powerbi.DataViewValueColumn | null = null;
    private searchTerm: string = "";
    private allSelected: boolean = true;
    private expandedState: Map<string, boolean> = new Map();
    private selectedState: Map<string, boolean> = new Map();
    private dataView: DataView | null = null;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.formattingSettingsService = new FormattingSettingsService();
        this.target = options.element;

        this.container = document.createElement("div");
        this.container.className = "hierarchy-slicer";
        this.target.appendChild(this.container);

        // Header
        this.headerEl = document.createElement("div");
        this.headerEl.className = "slicer-header";
        this.container.appendChild(this.headerEl);

        // Search
        this.searchContainer = document.createElement("div");
        this.searchContainer.className = "slicer-search";
        this.searchEl = document.createElement("input");
        this.searchEl.type = "text";
        this.searchEl.placeholder = "Search...";
        this.searchEl.className = "slicer-search-input";
        this.searchEl.addEventListener("input", () => {
            this.searchTerm = this.searchEl.value.toLowerCase();
            this.renderList();
        });
        this.searchContainer.appendChild(this.searchEl);
        this.container.appendChild(this.searchContainer);

        // Select All
        this.selectAllEl = document.createElement("div");
        this.selectAllEl.className = "slicer-item slicer-select-all";
        this.selectAllEl.addEventListener("click", () => this.toggleSelectAll());
        this.container.appendChild(this.selectAllEl);

        // List
        this.listEl = document.createElement("div");
        this.listEl.className = "slicer-list";
        this.container.appendChild(this.listEl);
    }

    public update(options: VisualUpdateOptions) {
        if (!options || !options.dataViews || !options.dataViews[0]) {
            this.clearVisual();
            return;
        }

        this.dataView = options.dataViews[0];
        this.formattingSettings = this.formattingSettingsService.populateFormattingSettingsModel(
            VisualFormattingSettingsModel, this.dataView
        );

        this.parseData(this.dataView);
        this.applyFormatting();
        this.renderList();
    }

    private parseData(dataView: DataView): void {
        const categorical = dataView.categorical;
        if (!categorical || !categorical.categories || categorical.categories.length === 0) {
            this.rootNodes = [];
            return;
        }

        this.categories = categorical.categories;
        this.measureValues = categorical.values && categorical.values.length > 0
            ? categorical.values[0] : null;

        const levelCount = this.categories.length;
        const rowCount = this.categories[0].values.length;

        // Build tree
        const rootMap = new Map<string, HierarchyNode>();
        this.rootNodes = [];

        for (let row = 0; row < rowCount; row++) {
            let currentMap = rootMap;
            let currentChildren = this.rootNodes;
            const pathSoFar: string[] = [];

            for (let level = 0; level < levelCount; level++) {
                const val = this.categories[level].values[row];
                const displayName = val != null ? String(val) : "(Blank)";
                pathSoFar.push(displayName);
                const nodeId = pathSoFar.join("||");

                let node: HierarchyNode;
                if (currentMap.has(nodeId)) {
                    node = currentMap.get(nodeId)!;
                    node.rowIndices.push(row);
                } else {
                    const prevExpanded = this.expandedState.get(nodeId);
                    const prevSelected = this.selectedState.get(nodeId);
                    const expandDefault = this.formattingSettings?.hierarchySettingsCard?.expandByDefault?.value ?? false;

                    node = {
                        id: nodeId,
                        displayName: displayName,
                        level: level,
                        value: null,
                        children: [],
                        isExpanded: prevExpanded !== undefined ? prevExpanded : expandDefault,
                        isSelected: prevSelected !== undefined ? prevSelected : true,
                        path: [...pathSoFar],
                        rowIndices: [row]
                    };
                    currentMap.set(nodeId, node);
                    currentChildren.push(node);
                }

                // If this is a leaf level or we want totals, accumulate measure values
                if (this.measureValues) {
                    const measureVal = this.measureValues.values[row];
                    if (typeof measureVal === "number") {
                        // Only assign directly to leaf nodes; parent totals computed after
                        if (level === levelCount - 1) {
                            node.value = (node.value || 0) + measureVal;
                        }
                    }
                }

                // Create child map for next level
                if (!(<any>node)._childMap) {
                    (<any>node)._childMap = new Map<string, HierarchyNode>();
                }
                currentMap = (<any>node)._childMap;
                currentChildren = node.children;
            }
        }

        // Compute parent totals by summing children
        this.computeTotals(this.rootNodes);

        // Sync expanded/selected state
        this.syncState(this.rootNodes);
    }

    private computeTotals(nodes: HierarchyNode[]): number {
        let sum = 0;
        for (const node of nodes) {
            if (node.children.length > 0) {
                node.value = this.computeTotals(node.children);
            }
            sum += node.value || 0;
        }
        return sum;
    }

    private syncState(nodes: HierarchyNode[]): void {
        for (const node of nodes) {
            this.expandedState.set(node.id, node.isExpanded);
            this.selectedState.set(node.id, node.isSelected);
            this.syncState(node.children);
        }
    }

    private applyFormatting(): void {
        const s = this.formattingSettings;

        // Header
        const showHeader = s.headerCard.show.value;
        this.headerEl.style.display = showHeader ? "block" : "none";
        if (showHeader) {
            const titleText = s.headerCard.title.value ||
                (this.categories.length > 0 ? this.categories.map(c => c.source.displayName).join(" > ") : "Slicer");
            this.headerEl.textContent = titleText;
            this.headerEl.style.color = s.headerCard.fontColor.value.value || "#333333";
            this.headerEl.style.backgroundColor = s.headerCard.background.value.value || "transparent";
            this.headerEl.style.fontSize = s.headerCard.fontSize.value + "px";
            this.headerEl.style.fontWeight = s.headerCard.bold.value ? "bold" : "normal";
            this.headerEl.style.fontStyle = s.headerCard.italic.value ? "italic" : "normal";
        }

        // Search
        this.searchContainer.style.display = s.slicerSettingsCard.showSearch.value ? "block" : "none";

        // Select All
        const showSelectAll = s.slicerSettingsCard.showSelectAll.value && !s.slicerSettingsCard.singleSelect.value;
        this.selectAllEl.style.display = showSelectAll ? "flex" : "none";

        // CSS custom properties for dynamic styling
        const root = this.container;
        root.style.setProperty("--item-font-color", s.itemsCard.fontColor.value.value || "#333333");
        root.style.setProperty("--item-bg", s.itemsCard.background.value.value || "transparent");
        root.style.setProperty("--item-alt-bg", s.itemsCard.alternateBackground.value.value || "transparent");
        root.style.setProperty("--item-font-size", s.itemsCard.fontSize.value + "px");
        root.style.setProperty("--item-font-weight", s.itemsCard.bold.value ? "bold" : "normal");
        root.style.setProperty("--item-font-style", s.itemsCard.italic.value ? "italic" : "normal");
        root.style.setProperty("--item-padding", s.itemsCard.padding.value + "px");

        root.style.setProperty("--checkbox-color", s.selectionControlsCard.checkboxColor.value.value || "#0078D4");
        root.style.setProperty("--selected-bg", s.selectionControlsCard.selectedBackground.value.value || "#E6F2FF");
        root.style.setProperty("--selected-font-color", s.selectionControlsCard.selectedFontColor.value.value || "#333333");
        root.style.setProperty("--hover-bg", s.selectionControlsCard.hoverBackground.value.value || "#F0F0F0");
        root.style.setProperty("--hover-font-color", s.selectionControlsCard.hoverFontColor.value.value || "#333333");

        root.style.setProperty("--indent-size", s.hierarchySettingsCard.indentSize.value + "px");
    }

    private renderList(): void {
        while (this.listEl.firstChild) this.listEl.removeChild(this.listEl.firstChild);

        // Determine if all are selected
        this.allSelected = this.areAllSelected(this.rootNodes);

        // Render select all
        this.renderSelectAll();

        // Render tree
        let visibleIndex = 0;
        this.renderNodes(this.rootNodes, this.listEl, 0, { index: visibleIndex });
    }

    private renderSelectAll(): void {
        const s = this.formattingSettings;
        const showSelectAll = s.slicerSettingsCard.showSelectAll.value && !s.slicerSettingsCard.singleSelect.value;
        if (!showSelectAll) return;

        while (this.selectAllEl.firstChild) this.selectAllEl.removeChild(this.selectAllEl.firstChild);

        const checkbox = this.createCheckbox(this.allSelected, false);
        this.selectAllEl.appendChild(checkbox);

        const label = document.createElement("span");
        label.className = "slicer-item-label";
        label.textContent = "Select All";
        this.selectAllEl.appendChild(label);
    }

    private renderNodes(
        nodes: HierarchyNode[],
        parentEl: HTMLElement,
        depth: number,
        counter: { index: number }
    ): void {
        const s = this.formattingSettings;
        const showTotals = s.hierarchySettingsCard.showTotals.value;
        const singleSelect = s.slicerSettingsCard.singleSelect.value;
        const hasMultipleLevels = this.categories.length > 1;

        for (const node of nodes) {
            // Search filter
            if (this.searchTerm && !this.matchesSearch(node)) {
                continue;
            }

            const row = document.createElement("div");
            row.className = "slicer-item";
            if (node.isSelected) row.classList.add("selected");

            // Alternate background
            const altBg = s.itemsCard.alternateBackground.value.value;
            if (altBg && counter.index % 2 === 1) {
                row.style.backgroundColor = altBg;
            }
            counter.index++;

            // Indent
            const indent = depth * s.hierarchySettingsCard.indentSize.value;

            // Expand/collapse toggle for parent nodes
            const leftContent = document.createElement("div");
            leftContent.className = "slicer-item-left";
            leftContent.style.paddingLeft = indent + "px";

            if (node.children.length > 0 && hasMultipleLevels) {
                const toggle = document.createElement("span");
                toggle.className = "slicer-expand-toggle";
                toggle.textContent = node.isExpanded ? "\u25BC" : "\u25B6";
                toggle.addEventListener("click", (e) => {
                    e.stopPropagation();
                    node.isExpanded = !node.isExpanded;
                    this.expandedState.set(node.id, node.isExpanded);
                    this.renderList();
                });
                leftContent.appendChild(toggle);
            } else if (hasMultipleLevels) {
                // Leaf spacer
                const spacer = document.createElement("span");
                spacer.className = "slicer-expand-spacer";
                leftContent.appendChild(spacer);
            }

            // Checkbox
            const isPartial = node.children.length > 0 && this.isPartiallySelected(node);
            const checkbox = this.createCheckbox(node.isSelected, isPartial);
            leftContent.appendChild(checkbox);

            // Label
            const label = document.createElement("span");
            label.className = "slicer-item-label";
            label.textContent = node.displayName;
            leftContent.appendChild(label);

            row.appendChild(leftContent);

            // Value/total
            if (showTotals && node.value != null && this.measureValues) {
                const valueEl = document.createElement("span");
                valueEl.className = "slicer-item-value";
                valueEl.textContent = this.formatValue(node.value);
                row.appendChild(valueEl);
            }

            // Click handler
            row.addEventListener("click", () => {
                if (singleSelect) {
                    this.clearAllSelections(this.rootNodes);
                    node.isSelected = true;
                    this.setChildrenSelected(node, true);
                } else {
                    node.isSelected = !node.isSelected;
                    this.setChildrenSelected(node, node.isSelected);
                    this.updateParentSelection(node);
                }
                this.syncState(this.rootNodes);
                this.renderList();
                this.applyFilter();
            });

            parentEl.appendChild(row);

            // Render children if expanded
            if (node.isExpanded && node.children.length > 0) {
                this.renderNodes(node.children, parentEl, depth + 1, counter);
            }
        }
    }

    private createCheckbox(checked: boolean, partial: boolean): HTMLElement {
        const cb = document.createElement("span");
        cb.className = "slicer-checkbox";
        if (checked && !partial) {
            cb.classList.add("checked");
            cb.textContent = "\u2713";
        } else if (partial) {
            cb.classList.add("partial");
            cb.textContent = "\u2212";
        }
        return cb;
    }

    private matchesSearch(node: HierarchyNode): boolean {
        if (node.displayName.toLowerCase().includes(this.searchTerm)) return true;
        for (const child of node.children) {
            if (this.matchesSearch(child)) return true;
        }
        return false;
    }

    private areAllSelected(nodes: HierarchyNode[]): boolean {
        for (const node of nodes) {
            if (!node.isSelected) return false;
            if (!this.areAllSelected(node.children)) return false;
        }
        return true;
    }

    private isPartiallySelected(node: HierarchyNode): boolean {
        if (node.children.length === 0) return false;
        let hasSelected = false;
        let hasUnselected = false;
        for (const child of node.children) {
            if (child.isSelected) hasSelected = true;
            else hasUnselected = true;
            if (hasSelected && hasUnselected) return true;
            if (child.children.length > 0 && this.isPartiallySelected(child)) return true;
        }
        return hasSelected && hasUnselected;
    }

    private toggleSelectAll(): void {
        this.allSelected = !this.allSelected;
        this.setAllSelections(this.rootNodes, this.allSelected);
        this.syncState(this.rootNodes);
        this.renderList();
        this.applyFilter();
    }

    private setAllSelections(nodes: HierarchyNode[], selected: boolean): void {
        for (const node of nodes) {
            node.isSelected = selected;
            this.setAllSelections(node.children, selected);
        }
    }

    private clearAllSelections(nodes: HierarchyNode[]): void {
        for (const node of nodes) {
            node.isSelected = false;
            this.clearAllSelections(node.children);
        }
    }

    private setChildrenSelected(node: HierarchyNode, selected: boolean): void {
        for (const child of node.children) {
            child.isSelected = selected;
            this.setChildrenSelected(child, selected);
        }
    }

    private updateParentSelection(node: HierarchyNode): void {
        // Walk up from node and update parent states
        // We need to find the parent by searching the tree
        this.updateParentsInTree(this.rootNodes);
    }

    private updateParentsInTree(nodes: HierarchyNode[]): void {
        for (const node of nodes) {
            if (node.children.length > 0) {
                this.updateParentsInTree(node.children);
                const allChildrenSelected = node.children.every(c => c.isSelected);
                const anyChildSelected = node.children.some(c => c.isSelected);
                node.isSelected = allChildrenSelected;
            }
        }
    }

    private applyFilter(): void {
        if (this.categories.length === 0) return;

        // If all selected, clear the filter
        if (this.areAllSelected(this.rootNodes)) {
            this.host.applyJsonFilter(null, "general", "filter", FilterAction.remove);
            return;
        }

        // Collect selected leaf row indices
        const selectedRows = new Set<number>();
        this.collectSelectedRows(this.rootNodes, selectedRows);

        if (selectedRows.size === 0) {
            // Nothing selected - apply an impossible filter to show no data
            const column = this.categories[0].source;
            const filter = new models.BasicFilter(
                { table: column.queryName!.split(".")[0], column: column.displayName },
                "In",
                ["\x00__IMPOSSIBLE_VALUE__\x00"]
            );
            this.host.applyJsonFilter(filter, "general", "filter", FilterAction.merge);
            return;
        }

        // Build filter based on hierarchy levels
        // For single-level, use BasicFilter
        // For multi-level, use tuple filter
        if (this.categories.length === 1) {
            this.applySingleLevelFilter(selectedRows);
        } else {
            this.applyMultiLevelFilter(selectedRows);
        }
    }

    private collectSelectedRows(nodes: HierarchyNode[], rows: Set<number>): void {
        for (const node of nodes) {
            if (node.children.length === 0) {
                // Leaf node
                if (node.isSelected) {
                    for (const idx of node.rowIndices) {
                        rows.add(idx);
                    }
                }
            } else {
                // Parent node: collect from children
                this.collectSelectedRows(node.children, rows);
            }
        }
    }

    private applySingleLevelFilter(selectedRows: Set<number>): void {
        const column = this.categories[0].source;
        const values: (string | number | boolean)[] = [];

        for (const row of selectedRows) {
            const val = this.categories[0].values[row];
            if (val != null) {
                values.push(val as string | number | boolean);
            }
        }

        // Deduplicate
        const uniqueValues = [...new Set(values)];

        const filter = new models.BasicFilter(
            {
                table: column.queryName!.split(".")[0],
                column: column.displayName
            },
            "In",
            uniqueValues
        );

        this.host.applyJsonFilter(filter, "general", "filter", FilterAction.merge);
    }

    private applyMultiLevelFilter(selectedRows: Set<number>): void {
        // Build tuple filter for multi-column selection
        const targets: models.IFilterColumnTarget[] = this.categories.map(cat => ({
            table: cat.source.queryName!.split(".")[0],
            column: cat.source.displayName
        }));

        const tupleValues: models.TupleValueType[] = [];

        for (const row of selectedRows) {
            const tuple: models.ITupleElementValue[] = this.categories.map(cat => {
                const val = cat.values[row];
                return {
                    value: val != null ? val as models.PrimitiveValueType : null as any
                } as models.ITupleElementValue;
            });
            tupleValues.push(tuple);
        }

        // Deduplicate tuples by string representation
        const seen = new Set<string>();
        const uniqueTuples: models.TupleValueType[] = [];
        for (const t of tupleValues) {
            const key = JSON.stringify(t.map(v => v.value));
            if (!seen.has(key)) {
                seen.add(key);
                uniqueTuples.push(t);
            }
        }

        const filter = new models.TupleFilter(targets, "In", uniqueTuples);

        this.host.applyJsonFilter(
            filter as any,
            "general",
            "filter",
            FilterAction.merge
        );
    }

    private formatValue(value: number): string {
        if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(1) + "B";
        if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1) + "M";
        if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(1) + "K";
        return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }

    private clearVisual(): void {
        this.rootNodes = [];
        while (this.listEl.firstChild) this.listEl.removeChild(this.listEl.firstChild);
        this.headerEl.textContent = "Slicer";
    }

    public getFormattingModel(): powerbi.visuals.FormattingModel {
        return this.formattingSettingsService.buildFormattingModel(this.formattingSettings);
    }
}
