"use strict";

import { formattingSettings } from "powerbi-visuals-utils-formattingmodel";

import FormattingSettingsCard = formattingSettings.SimpleCard;
import FormattingSettingsSlice = formattingSettings.Slice;
import FormattingSettingsModel = formattingSettings.Model;

export class SlicerSettingsCard extends FormattingSettingsCard {
    singleSelect = new formattingSettings.ToggleSwitch({
        name: "singleSelect",
        displayName: "Single select",
        value: false
    });

    showSelectAll = new formattingSettings.ToggleSwitch({
        name: "showSelectAll",
        displayName: "Select all",
        value: true
    });

    showSearch = new formattingSettings.ToggleSwitch({
        name: "showSearch",
        displayName: "Search",
        value: true
    });

    name: string = "slicerSettings";
    displayName: string = "Slicer Settings";
    slices: Array<FormattingSettingsSlice> = [this.singleSelect, this.showSelectAll, this.showSearch];
}

export class HeaderCard extends FormattingSettingsCard {
    show = new formattingSettings.ToggleSwitch({
        name: "show",
        displayName: "Show header",
        value: true
    });

    title = new formattingSettings.TextInput({
        name: "title",
        displayName: "Title",
        value: "",
        placeholder: "Auto"
    });

    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font color",
        value: { value: "#333333" }
    });

    background = new formattingSettings.ColorPicker({
        name: "background",
        displayName: "Background",
        value: { value: "" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 13
    });

    bold = new formattingSettings.ToggleSwitch({
        name: "bold",
        displayName: "Bold",
        value: true
    });

    italic = new formattingSettings.ToggleSwitch({
        name: "italic",
        displayName: "Italic",
        value: false
    });

    name: string = "header";
    displayName: string = "Slicer Header";
    slices: Array<FormattingSettingsSlice> = [
        this.show, this.title, this.fontColor, this.background,
        this.fontSize, this.bold, this.italic
    ];
}

export class ItemsCard extends FormattingSettingsCard {
    fontColor = new formattingSettings.ColorPicker({
        name: "fontColor",
        displayName: "Font color",
        value: { value: "#333333" }
    });

    background = new formattingSettings.ColorPicker({
        name: "background",
        displayName: "Background",
        value: { value: "" }
    });

    alternateBackground = new formattingSettings.ColorPicker({
        name: "alternateBackground",
        displayName: "Alternate background",
        value: { value: "" }
    });

    fontSize = new formattingSettings.NumUpDown({
        name: "fontSize",
        displayName: "Text size",
        value: 12
    });

    bold = new formattingSettings.ToggleSwitch({
        name: "bold",
        displayName: "Bold",
        value: false
    });

    italic = new formattingSettings.ToggleSwitch({
        name: "italic",
        displayName: "Italic",
        value: false
    });

    padding = new formattingSettings.NumUpDown({
        name: "padding",
        displayName: "Padding",
        value: 4
    });

    name: string = "items";
    displayName: string = "Values";
    slices: Array<FormattingSettingsSlice> = [
        this.fontColor, this.background, this.alternateBackground,
        this.fontSize, this.bold, this.italic, this.padding
    ];
}

export class SelectionControlsCard extends FormattingSettingsCard {
    checkboxColor = new formattingSettings.ColorPicker({
        name: "checkboxColor",
        displayName: "Checkbox color",
        value: { value: "#0078D4" }
    });

    selectedBackground = new formattingSettings.ColorPicker({
        name: "selectedBackground",
        displayName: "Selected background",
        value: { value: "#E6F2FF" }
    });

    selectedFontColor = new formattingSettings.ColorPicker({
        name: "selectedFontColor",
        displayName: "Selected font color",
        value: { value: "#333333" }
    });

    hoverBackground = new formattingSettings.ColorPicker({
        name: "hoverBackground",
        displayName: "Hover background",
        value: { value: "#F0F0F0" }
    });

    hoverFontColor = new formattingSettings.ColorPicker({
        name: "hoverFontColor",
        displayName: "Hover font color",
        value: { value: "#333333" }
    });

    name: string = "selectionControls";
    displayName: string = "Selection";
    slices: Array<FormattingSettingsSlice> = [
        this.checkboxColor, this.selectedBackground, this.selectedFontColor,
        this.hoverBackground, this.hoverFontColor
    ];
}

export class PivotSettingsCard extends FormattingSettingsCard {
    indentSize = new formattingSettings.NumUpDown({
        name: "indentSize",
        displayName: "Indent size (px)",
        value: 20
    });

    showTotals = new formattingSettings.ToggleSwitch({
        name: "showTotals",
        displayName: "Show totals",
        value: true
    });

    expandByDefault = new formattingSettings.ToggleSwitch({
        name: "expandByDefault",
        displayName: "Expand all by default",
        value: false
    });

    totalLabel = new formattingSettings.TextInput({
        name: "totalLabel",
        displayName: "Total label",
        value: "",
        placeholder: "Total"
    });

    name: string = "pivotSettings";
    displayName: string = "Pivot";
    slices: Array<FormattingSettingsSlice> = [
        this.indentSize, this.showTotals, this.expandByDefault, this.totalLabel
    ];
}

export class VisualFormattingSettingsModel extends FormattingSettingsModel {
    slicerSettingsCard = new SlicerSettingsCard();
    headerCard = new HeaderCard();
    itemsCard = new ItemsCard();
    selectionControlsCard = new SelectionControlsCard();
    pivotSettingsCard = new PivotSettingsCard();

    cards = [
        this.slicerSettingsCard,
        this.headerCard,
        this.itemsCard,
        this.selectionControlsCard,
        this.pivotSettingsCard
    ];
}
