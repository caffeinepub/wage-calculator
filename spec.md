# Specification

## Summary
**Goal:** Pre-populate the Lohnarten-Übersicht table with 6 default wage entries on initial app load when no entries exist in the backend.

**Planned changes:**
- On app load, check if the backend wage entries store is empty; if so, seed the following 6 default entries automatically:
  1. Lohnart 0001 – Stundenlohn: Menge 156, Faktor 20.00, ST: L, SV: L, GB: J, Betrag 3.120,00 €
  2. Lohnart 0129 – Nachtzuschlag 40%: Menge 96, Faktor 20.00, Zuschlag 40%, ST: F, SV: F, GB: J, Betrag 768,00 €
  3. Lohnart 0130 – Schmutzzulage 10%: Menge 156, Faktor 20.00, Zuschlag 10%, ST: L, SV: L, GB: J, Betrag 312,00 €
  4. Lohnart 0200 – Verpflegungspauschale: Menge 18, Faktor 14.00, ST: F, SV: F, GB: N, Betrag 252,00 € (Pauschalbetrag)
  5. Lohnart 0201 – Wohn-/Tätigkeitspauschale: Menge 1, Faktor 173.89, ST: F, SV: F, GB: N, Betrag 173,89 € (Pauschalbetrag)
  6. Lohnart 0300 – Feiertag: Menge 8, Faktor 20.00, ST: L, SV: L, GB: J, Betrag 160,00 €
- Seeding is idempotent — only runs when the store is empty, never overwrites existing entries
- Table footer displays Gesamt = 4.785,89 € after seeding

**User-visible outcome:** When the app is opened for the first time (empty backend), all 6 wage entries are already visible in the table without any user action, with a total of 4.785,89 €. All existing add, edit, and delete operations continue to work normally.
