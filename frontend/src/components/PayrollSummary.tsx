import { useState, useEffect } from 'react';
import { useSummary, useLohnsteuer, useSetLohnsteuer } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingDown, TrendingUp, Wallet, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function formatEuro(value: number): string {
  return value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

interface SummaryRowProps {
  label: string;
  value: number;
  isDeduction?: boolean;
  isTotal?: boolean;
  isHighlight?: boolean;
  loading?: boolean;
}

function SummaryRow({ label, value, isDeduction, isTotal, isHighlight, loading }: SummaryRowProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-between py-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between py-2 px-3 rounded transition-colors ${
        isTotal
          ? 'bg-emerald-light border border-emerald-border'
          : isHighlight
          ? 'bg-surface'
          : ''
      }`}
    >
      <span
        className={`text-sm ${
          isTotal ? 'font-bold text-foreground' : isHighlight ? 'font-semibold text-foreground' : 'text-muted-foreground'
        }`}
      >
        {label}
      </span>
      <span
        className={`font-mono text-sm font-semibold tabular-nums ${
          isDeduction
            ? 'text-destructive'
            : isTotal
            ? 'text-emerald font-bold text-base'
            : isHighlight
            ? 'text-foreground'
            : 'text-foreground'
        }`}
      >
        {isDeduction ? '− ' : ''}{formatEuro(Math.abs(value))}
      </span>
    </div>
  );
}

export default function PayrollSummary() {
  const { data: summary, isLoading: summaryLoading, isError: summaryError } = useSummary();
  const { data: lohnsteuerValue, isLoading: lohnsteuerLoading } = useLohnsteuer();
  const setLohnsteuerMutation = useSetLohnsteuer();

  const [lohnsteuerInput, setLohnsteuerInput] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (lohnsteuerValue !== undefined && !isDirty) {
      setLohnsteuerInput(
        lohnsteuerValue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      );
    }
  }, [lohnsteuerValue, isDirty]);

  const handleLohnsteuerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLohnsteuerInput(e.target.value);
    setIsDirty(true);
  };

  const handleSaveLohnsteuer = async () => {
    const normalized = lohnsteuerInput.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(normalized);
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Bitte einen gültigen Betrag eingeben');
      return;
    }
    try {
      await setLohnsteuerMutation.mutateAsync(parsed);
      setIsDirty(false);
      toast.success('Lohnsteuer gespeichert');
    } catch {
      toast.error('Fehler beim Speichern der Lohnsteuer');
    }
  };

  const isLoading = summaryLoading || lohnsteuerLoading;

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="pb-3 bg-form-header border-b border-border rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-foreground">
          <div className="w-7 h-7 rounded bg-emerald flex items-center justify-center">
            <Calculator className="w-4 h-4 text-white" />
          </div>
          Lohnabrechnung – Zusammenfassung
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4 pb-5 px-4">
        {summaryError ? (
          <p className="text-sm text-destructive text-center py-4">
            Fehler beim Laden der Zusammenfassung.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1: Brutto-Werte */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Brutto-Werte
                </h3>
              </div>
              <SummaryRow
                label="Abrechnungs-Brutto"
                value={summary?.abrechnungsBrutto ?? 0}
                isHighlight
                loading={isLoading}
              />
              <SummaryRow
                label="Steuer-Brutto (L)"
                value={summary?.steuerBrutto ?? 0}
                loading={isLoading}
              />
              <SummaryRow
                label="SV-Brutto (L)"
                value={summary?.svBrutto ?? 0}
                loading={isLoading}
              />
            </div>

            {/* Column 2: Abzüge */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Abzüge
                </h3>
              </div>

              {/* Lohnsteuer editable row */}
              <div className="flex items-center justify-between py-2 px-3 rounded bg-surface border border-border">
                <Label htmlFor="lohnsteuer-input" className="text-sm text-muted-foreground cursor-pointer">
                  Lohnsteuer
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive font-semibold">−</span>
                  <div className="relative flex items-center gap-1">
                    {lohnsteuerLoading ? (
                      <Skeleton className="h-8 w-28" />
                    ) : (
                      <>
                        <Input
                          id="lohnsteuer-input"
                          value={lohnsteuerInput}
                          onChange={handleLohnsteuerChange}
                          className="h-8 w-28 text-right font-mono text-sm text-destructive border-border focus:border-emerald-border"
                          placeholder="0,00"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className={`h-8 w-8 ${isDirty ? 'text-emerald hover:bg-emerald-light' : 'text-muted-foreground'}`}
                          onClick={handleSaveLohnsteuer}
                          disabled={setLohnsteuerMutation.isPending || !isDirty}
                          title="Lohnsteuer speichern"
                        >
                          {setLohnsteuerMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <SummaryRow
                label="KV-Beitrag"
                value={summary?.kvBeitrag ?? 0}
                isDeduction
                loading={isLoading}
              />
              <SummaryRow
                label="RV-Beitrag"
                value={summary?.rvBeitrag ?? 0}
                isDeduction
                loading={isLoading}
              />
              <SummaryRow
                label="AV-Beitrag"
                value={summary?.avBeitrag ?? 0}
                isDeduction
                loading={isLoading}
              />
              <SummaryRow
                label="PV-Beitrag"
                value={summary?.pvBeitrag ?? 0}
                isDeduction
                loading={isLoading}
              />
            </div>

            {/* Column 3: Ergebnis */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 mb-3">
                <Wallet className="w-4 h-4 text-emerald" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ergebnis
                </h3>
              </div>
              <SummaryRow
                label="Nettoentgelt mtl."
                value={summary?.nettoentgelt ?? 0}
                isHighlight
                loading={isLoading}
              />

              <Separator className="my-2" />

              <SummaryRow
                label="Auszahlungsbetrag"
                value={summary?.auszahlungsbetrag ?? 0}
                isTotal
                loading={isLoading}
              />

              {!isLoading && summary && (
                <p className="text-xs text-muted-foreground px-3 pt-1">
                  Nettoentgelt + steuerfreie Verpflegungspauschale
                </p>
              )}
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
}
