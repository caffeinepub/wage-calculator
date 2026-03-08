import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, PlusCircle } from "lucide-react";
import { useState } from "react";
import type { WageEntry } from "../backend";
import PayrollSummary from "../components/PayrollSummary";
import WageEntryForm from "../components/WageEntryForm";
import WageEntryTable from "../components/WageEntryTable";
import { useGetAllWageEntries } from "../hooks/useQueries";
import { useSeedDefaultEntries } from "../hooks/useSeedDefaultEntries";

export default function WageCalculator() {
  const [editingEntry, setEditingEntry] = useState<WageEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { data: entries = [], isLoading } = useGetAllWageEntries();
  const { isSeeding, seedError } = useSeedDefaultEntries();

  const handleAddNew = () => {
    setEditingEntry(null);
    setShowForm(true);
  };

  const handleEdit = (entry: WageEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingEntry(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Lohnarten-Übersicht
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Verwalten Sie Lohnarten und berechnen Sie Beträge automatisch
          </p>
        </div>
        <Button
          onClick={handleAddNew}
          disabled={isSeeding}
          className="bg-emerald hover:bg-emerald-dark text-white gap-2 shadow-xs"
        >
          {isSeeding ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <PlusCircle className="w-4 h-4" />
          )}
          Neue Lohnart
        </Button>
      </div>

      {seedError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{seedError.message}</AlertDescription>
        </Alert>
      )}

      {showForm && (
        <WageEntryForm
          editingEntry={editingEntry}
          onClose={handleFormClose}
          existingCodes={entries.map((e) => e.wageTypeCode)}
        />
      )}

      <WageEntryTable
        entries={entries}
        isLoading={isLoading}
        onEdit={handleEdit}
      />

      <PayrollSummary />
    </div>
  );
}
