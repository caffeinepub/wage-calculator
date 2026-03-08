# Lohnrechner (AOK-Stil)

## Current State

The app is a German payroll wage calculator (Lohnabrechnung) using PAP 2026 logic. It has:
- A WageCalculator page with wage entries table, entry forms, and a PayrollSummary
- A React + TypeScript frontend with Tailwind CSS and OKLCH design tokens
- Backend integration for CRUD wage entries

## Requested Changes (Diff)

### Add
- **AOK Lohnrechner page** (`AokCalculator.tsx`): A standalone, self-contained German net wage calculator modeled after the AOK Brutto-Netto-Rechner UI shown in the uploaded screenshot.
  - Three tab sections at top: "Arbeitnehmer", "Arbeitgeber", "weitere Angaben"
  - **Arbeitnehmer tab inputs**:
    - Zuständige AOK (dropdown: regional AOK options)
    - Berechnungszeitraum (radio: Jahr / Monat / Teilmonat)
    - Bruttolohn input (highlighted yellow/green, editable)
    - Umständige oder befristete Beschäftigung (dropdown: nein/ja)
    - Beschäftigung in der Berufsausbildung (checkbox)
    - Beschäftigungsort (dropdown: Bitte auswählen + all 16 states)
    - Beitragsschlag zur Pflegeversicherung (radio: ja, über 23 Jahre und kinderlos / nein, unter 23 Jahre oder Kinder)
    - Lohnsteuerklasse (radio: I, II, III, IV, V, VI)
    - Kinderfreibeträge (dropdown: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6)
    - Kirchensteuer (dropdown: keine Kirchensteuer + all states)
    - Geburtsjahr (dropdown: nach 1961 / 1961 und früher)
    - Altersentlastungsbetrag (checkbox)
    - Beitragsgruppe KV (dropdown: 1 - KV-Pflicht, allgemeiner Beitrag)
    - Beitragsgruppe RV (dropdown: 1 - RV-Pflicht, voller Beitrag)
    - Beitragsgruppe AV (dropdown: 1 - AV-Pflicht, voller Beitrag)
    - Beitragsgruppe PV (dropdown: 1 - PV-Pflicht)
  - **Results section** (below inputs, always visible):
    - Bruttolohn display
    - Lohnsteuer (−)
    - Kirchensteuer (−)
    - Solidaritätszuschlag (−)
    - Steuern gesamt
    - Krankenversicherung (−)
    - Zusatzbeitrag (−)
    - Rentenversicherung (−)
    - Arbeitslosenversicherung (−)
    - Pflegeversicherung (−)
    - Sozialabgaben gesamt
    - **Nettogehalt** (highlighted result)
    - Download PDF / Excel buttons
  - All calculations done purely in frontend (no backend calls), using PAP 2026 logic
  - Uses localStorage prefix `aok_` for persisting inputs

- **Tab navigation in App.tsx** to switch between "Lohnabrechnung" (existing) and "AOK Lohnrechner" (new)

### Modify
- `App.tsx`: Add tab/button navigation at top to switch between WageCalculator and AokCalculator pages

### Remove
- Nothing removed

## Implementation Plan

1. Create `src/frontend/src/pages/AokCalculator.tsx` with:
   - Full PAP 2026 net wage calculation logic (inline, no backend)
   - All AOK-style input fields as shown in screenshot
   - Real-time recalculation on every input change
   - Results panel with all deduction line items
   - localStorage persistence with `aok_` prefix
   - PDF/Excel export buttons (using jsPDF/SheetJS from CDN or inline calculation export)

2. Update `App.tsx`:
   - Add state for active page (`'wage' | 'aok'`)
   - Add tab buttons in header or just below header
   - Render AokCalculator or WageCalculator based on active tab
