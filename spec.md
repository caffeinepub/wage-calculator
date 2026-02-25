# Specification

## Summary
**Goal:** Display the PayrollSummary component (Steuer-Brutto, SV-Brutto, Nettoentgelt, Auszahlung) directly below the WageEntryTable on the WageCalculator page without requiring any user interaction.

**Planned changes:**
- Render the existing PayrollSummary component on the WageCalculator page, positioned directly below the WageEntryTable
- Ensure the summary is always visible (no button click or toggle required)
- Show loading skeletons while the payroll summary data is being fetched
- Ensure the summary updates automatically when wage entries are added, edited, or deleted

**User-visible outcome:** Users can see the four key payroll summary values (Steuer-Brutto, SV-Brutto, Nettoentgelt, Auszahlung) at all times below the wage entry table, with automatic updates on any change.
