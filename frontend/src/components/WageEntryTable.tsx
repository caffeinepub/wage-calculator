import type { WageEntry } from '../backend';
import { useDeleteWageEntry } from '../hooks/useQueries';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface WageEntryTableProps {
  entries: WageEntry[];
  isLoading: boolean;
  onEdit: (entry: WageEntry) => void;
}

function FlagBadge({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded text-xs font-semibold font-mono bg-flag-bg text-flag-text border border-flag-border">
      {value}
    </span>
  );
}

function formatNumber(val: number | null | undefined): string {
  if (val == null) return '—';
  return val.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatCurrency(val: number): string {
  return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function WageEntryTable({ entries, isLoading, onEdit }: WageEntryTableProps) {
  const deleteMutation = useDeleteWageEntry();

  const handleDelete = async (wageTypeCode: string) => {
    try {
      await deleteMutation.mutateAsync(wageTypeCode);
      toast.success('Lohnart gelöscht');
    } catch {
      toast.error('Fehler beim Löschen');
    }
  };

  const totalBetrag = entries.reduce((sum, e) => sum + e.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide w-24 border-r border-border">
                Lohnart
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide border-r border-border">
                Bezeichnung
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right w-24 border-r border-border">
                Menge
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right w-24 border-r border-border">
                Faktor
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right w-28 border-r border-border">
                % / Zuschlag
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center w-16 border-r border-border">
                St
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center w-16 border-r border-border">
                SV
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center w-16 border-r border-border">
                GB
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right w-32 border-r border-border">
                Betrag (€)
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center w-24">
                Aktionen
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-12 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-muted-foreground/40" />
                    <p className="text-sm">Keine Lohnarten vorhanden</p>
                    <p className="text-xs">Klicken Sie auf „Neue Lohnart" um zu beginnen</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry, idx) => (
                <TableRow
                  key={entry.wageTypeCode}
                  className={`hover:bg-table-row-hover transition-colors ${idx % 2 === 0 ? 'bg-background' : 'bg-table-alt'}`}
                >
                  <TableCell className="font-mono text-sm font-medium text-foreground border-r border-border py-2.5">
                    {entry.wageTypeCode}
                  </TableCell>
                  <TableCell className="text-sm text-foreground border-r border-border py-2.5">
                    {entry.description}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-right text-foreground border-r border-border py-2.5">
                    {entry.quantity != null ? formatNumber(entry.quantity) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-right text-foreground border-r border-border py-2.5">
                    {entry.rate != null ? formatNumber(entry.rate) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-right border-r border-border py-2.5">
                    {entry.percentageSurcharge != null && entry.percentageSurcharge > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald" />
                        <span className="text-emerald font-semibold">{formatNumber(entry.percentageSurcharge)}%</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center border-r border-border py-2.5">
                    <FlagBadge value={entry.taxFlag} />
                  </TableCell>
                  <TableCell className="text-center border-r border-border py-2.5">
                    <FlagBadge value={entry.socialInsuranceFlag} />
                  </TableCell>
                  <TableCell className="text-center border-r border-border py-2.5">
                    <FlagBadge value={entry.taxableBenefitFlag} />
                  </TableCell>
                  <TableCell className="font-mono text-sm text-right font-semibold text-foreground border-r border-border py-2.5">
                    {formatCurrency(entry.amount)}
                  </TableCell>
                  <TableCell className="text-center py-2.5">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-emerald hover:bg-emerald-light"
                        onClick={() => onEdit(entry)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Lohnart löschen?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Möchten Sie die Lohnart <strong>{entry.wageTypeCode} – {entry.description}</strong> wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(entry.wageTypeCode)}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          {entries.length > 0 && (
            <TableFooter>
              <TableRow className="bg-table-footer hover:bg-table-footer border-t-2 border-border">
                <TableCell colSpan={8} className="text-sm font-semibold text-foreground py-3 border-r border-border">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald" />
                    Gesamt ({entries.length} {entries.length === 1 ? 'Eintrag' : 'Einträge'})
                  </span>
                </TableCell>
                <TableCell className="font-mono text-base font-bold text-foreground text-right py-3 border-r border-border">
                  {formatCurrency(totalBetrag)} €
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>
    </div>
  );
}
