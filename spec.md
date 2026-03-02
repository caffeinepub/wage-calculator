# Specification

## Summary
**Goal:** Build a fully client-side German payroll simulator (Lohn-Simulator XAL GmbH v10.0) with the official PAP Lohnsteuer 2026 engine embedded as a TypeScript module, covering wage entry, tax/SV parameters, results, employer costs, KPIs, and export functionality.

**Planned changes:**
- Embed the official PAP Lohnsteuer 2026 engine (BigDecimal, SqLohnsteuer, PapLohnsteuer) as a self-contained client-side TypeScript module with no jQuery dependency
- Implement a Lohndaten Erfassung section with six wage rows (Stundenlohn, Nachtzuschlag 40%, Schmutzzulage 10%, Feiertag, Verpflegungstage, Wohn-/Tätigkeitspauschale), computed row amounts, and an Abrechnungs-Brutto footer
- Implement a Steuer- & SV-Parameter panel with controls for Steuerklasse, Kinderfreibetrag, Bundesland, KV-Zusatzbeitrag, PV-Situation, Geburtsjahr, Kirchensteuer, and derived KiSt-Satz display
- Implement an Abrechnungsergebnis results panel showing Steuer-Brutto, itemized tax deductions, itemized AN SV deductions, steuerfreie Bezüge section, Abrechnungs-Netto, and a highlighted Auszahlungsbetrag box
- Implement an Arbeitgeber-Anteile & Gesamtkosten section showing all AG SV shares, pauschale LSt on Wohn-/Tätigkeitspauschale (16.86%), and a prominent Gesamtbelastung Arbeitgeber total
- Implement an Unternehmer-Kennzahlen KPI panel with 7 reactive metrics (Kosten/Stunde, Nettoquote, Nebenkostenquote, Break-Even, Angebot/Stunde, DB1, DB2)
- Implement a top Stammdaten bar with editable Mitarbeiter name, Personal-Nr., and Abrechnungsmonat fields
- Persist all inputs to localStorage on every change and restore on page load; provide a RESET button with confirmation dialog
- Implement XLSX export (SheetJS) with six data sections and filename including Monat and Mitarbeiter name
- Implement PDF export (jsPDF + jsPDF-AutoTable) with header, tables, and bold Auszahlung line
- Apply a professional dark-slate/amber accent theme with JetBrains Mono for numeric outputs, yellow-highlighted input fields, and a responsive two-column (7/5) desktop / single-column mobile layout

**User-visible outcome:** Users can enter employee wage data and tax/SV parameters, instantly see a fully calculated German payroll breakdown (taxes, social insurance, employer costs, KPIs), and export the result as a formatted XLSX or PDF file — all running entirely in the browser.
