import { useState, useEffect } from 'react';
import type { WageEntry } from '../backend';
import { useAddOrUpdateWageEntry, calculateBetrag } from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { X, Save, Calculator } from 'lucide-react';

interface WageEntryFormProps {
  editingEntry: WageEntry | null;
  onClose: () => void;
  existingCodes: string[];
}

const EMPTY_FORM = {
  wageTypeCode: '',
  description: '',
  quantity: '',
  rate: '',
  percentageSurcharge: '',
  taxFlag: 'L',
  socialInsuranceFlag: 'L',
  taxableBenefitFlag: 'J',
  manualAmount: '',
  isFixedAmount: false,
};

export default function WageEntryForm({ editingEntry, onClose, existingCodes }: WageEntryFormProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useAddOrUpdateWageEntry();

  useEffect(() => {
    if (editingEntry) {
      const isFixed = editingEntry.quantity == null && editingEntry.rate == null;
      setForm({
        wageTypeCode: editingEntry.wageTypeCode,
        description: editingEntry.description,
        quantity: editingEntry.quantity != null ? String(editingEntry.quantity) : '',
        rate: editingEntry.rate != null ? String(editingEntry.rate) : '',
        percentageSurcharge: editingEntry.percentageSurcharge != null ? String(editingEntry.percentageSurcharge) : '',
        taxFlag: editingEntry.taxFlag || 'L',
        socialInsuranceFlag: editingEntry.socialInsuranceFlag || 'L',
        taxableBenefitFlag: editingEntry.taxableBenefitFlag || 'J',
        manualAmount: isFixed ? String(editingEntry.amount) : '',
        isFixedAmount: isFixed,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [editingEntry]);

  const qty = parseFloat(form.quantity) || null;
  const rate = parseFloat(form.rate) || null;
  const surcharge = parseFloat(form.percentageSurcharge) || null;
  const calculatedBetrag = form.isFixedAmount
    ? parseFloat(form.manualAmount) || 0
    : calculateBetrag(qty, rate, surcharge);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.wageTypeCode.trim()) newErrors.wageTypeCode = 'Lohnart ist erforderlich';
    if (!form.description.trim()) newErrors.description = 'Bezeichnung ist erforderlich';
    if (!editingEntry && existingCodes.includes(form.wageTypeCode.trim())) {
      newErrors.wageTypeCode = 'Diese Lohnart existiert bereits';
    }
    if (!form.isFixedAmount) {
      if (form.quantity && isNaN(parseFloat(form.quantity))) newErrors.quantity = 'Ungültige Zahl';
      if (form.rate && isNaN(parseFloat(form.rate))) newErrors.rate = 'Ungültige Zahl';
      if (form.percentageSurcharge && isNaN(parseFloat(form.percentageSurcharge))) newErrors.percentageSurcharge = 'Ungültige Zahl';
    } else {
      if (!form.manualAmount || isNaN(parseFloat(form.manualAmount))) newErrors.manualAmount = 'Betrag ist erforderlich';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await mutation.mutateAsync({
        wageTypeCode: form.wageTypeCode.trim(),
        description: form.description.trim(),
        quantity: form.isFixedAmount ? null : (qty),
        rate: form.isFixedAmount ? null : (rate),
        percentageSurcharge: form.isFixedAmount ? null : (surcharge),
        taxFlag: form.taxFlag,
        socialInsuranceFlag: form.socialInsuranceFlag,
        taxableBenefitFlag: form.taxableBenefitFlag,
        amount: form.isFixedAmount ? (parseFloat(form.manualAmount) || null) : null,
      });
      toast.success(editingEntry ? 'Lohnart aktualisiert' : 'Lohnart hinzugefügt');
      onClose();
    } catch (err) {
      toast.error('Fehler beim Speichern der Lohnart');
    }
  };

  const set = (field: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-4 border-b border-border bg-form-header rounded-t-lg">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald" />
            {editingEntry ? 'Lohnart bearbeiten' : 'Neue Lohnart erfassen'}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="pt-5 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Lohnart */}
            <div className="space-y-1.5">
              <Label htmlFor="wageTypeCode" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Lohnart *
              </Label>
              <Input
                id="wageTypeCode"
                value={form.wageTypeCode}
                onChange={(e) => set('wageTypeCode', e.target.value)}
                placeholder="z.B. 0001"
                disabled={!!editingEntry}
                className={`font-mono text-sm ${errors.wageTypeCode ? 'border-destructive' : ''}`}
              />
              {errors.wageTypeCode && <p className="text-xs text-destructive">{errors.wageTypeCode}</p>}
            </div>

            {/* Bezeichnung */}
            <div className="space-y-1.5 sm:col-span-1 lg:col-span-2">
              <Label htmlFor="description" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Bezeichnung *
              </Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="z.B. Stundenlohn"
                className={`text-sm ${errors.description ? 'border-destructive' : ''}`}
              />
              {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
            </div>

            {/* Fixed Amount Toggle */}
            <div className="space-y-1.5 flex flex-col justify-end">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Typ
              </Label>
              <div className="flex items-center gap-2 h-9">
                <button
                  type="button"
                  onClick={() => set('isFixedAmount', !form.isFixedAmount)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                    form.isFixedAmount ? 'bg-emerald' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                      form.isFixedAmount ? 'translate-x-4' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-foreground">Pauschalbetrag</span>
              </div>
            </div>
          </div>

          {!form.isFixedAmount ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
              {/* Menge */}
              <div className="space-y-1.5">
                <Label htmlFor="quantity" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Menge
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  step="any"
                  value={form.quantity}
                  onChange={(e) => set('quantity', e.target.value)}
                  placeholder="0"
                  className={`font-mono text-sm text-right ${errors.quantity ? 'border-destructive' : ''}`}
                />
                {errors.quantity && <p className="text-xs text-destructive">{errors.quantity}</p>}
              </div>

              {/* Faktor */}
              <div className="space-y-1.5">
                <Label htmlFor="rate" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Faktor
                </Label>
                <Input
                  id="rate"
                  type="number"
                  step="any"
                  value={form.rate}
                  onChange={(e) => set('rate', e.target.value)}
                  placeholder="0"
                  className={`font-mono text-sm text-right ${errors.rate ? 'border-destructive' : ''}`}
                />
                {errors.rate && <p className="text-xs text-destructive">{errors.rate}</p>}
              </div>

              {/* % Zuschlag */}
              <div className="space-y-1.5">
                <Label htmlFor="percentageSurcharge" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  % Zuschlag
                </Label>
                <Input
                  id="percentageSurcharge"
                  type="number"
                  step="any"
                  min="0"
                  max="100"
                  value={form.percentageSurcharge}
                  onChange={(e) => set('percentageSurcharge', e.target.value)}
                  placeholder="0"
                  className={`font-mono text-sm text-right ${errors.percentageSurcharge ? 'border-destructive' : ''}`}
                />
                {errors.percentageSurcharge && <p className="text-xs text-destructive">{errors.percentageSurcharge}</p>}
              </div>

              {/* St */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">St</Label>
                <Select value={form.taxFlag} onValueChange={(v) => set('taxFlag', v)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                    <SelectItem value="P">P</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* SV */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SV</Label>
                <Select value={form.socialInsuranceFlag} onValueChange={(v) => set('socialInsuranceFlag', v)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* GB */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">GB</Label>
                <Select value={form.taxableBenefitFlag} onValueChange={(v) => set('taxableBenefitFlag', v)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="J">J</SelectItem>
                    <SelectItem value="N">N</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
              {/* Manual Betrag */}
              <div className="space-y-1.5 col-span-2">
                <Label htmlFor="manualAmount" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Betrag (€) *
                </Label>
                <Input
                  id="manualAmount"
                  type="number"
                  step="0.01"
                  value={form.manualAmount}
                  onChange={(e) => set('manualAmount', e.target.value)}
                  placeholder="0,00"
                  className={`font-mono text-sm text-right ${errors.manualAmount ? 'border-destructive' : ''}`}
                />
                {errors.manualAmount && <p className="text-xs text-destructive">{errors.manualAmount}</p>}
              </div>

              {/* St */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">St</Label>
                <Select value={form.taxFlag} onValueChange={(v) => set('taxFlag', v)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                    <SelectItem value="P">P</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* SV */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">SV</Label>
                <Select value={form.socialInsuranceFlag} onValueChange={(v) => set('socialInsuranceFlag', v)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="F">F</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* GB */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">GB</Label>
                <Select value={form.taxableBenefitFlag} onValueChange={(v) => set('taxableBenefitFlag', v)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="J">J</SelectItem>
                    <SelectItem value="N">N</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Calculated Preview */}
          {!form.isFixedAmount && (qty != null || rate != null) && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-emerald-light rounded-md border border-emerald-border">
              <Calculator className="w-4 h-4 text-emerald flex-shrink-0" />
              <div className="text-sm">
                <span className="text-muted-foreground">Berechneter Betrag: </span>
                <span className="font-mono font-semibold text-emerald">
                  {calculatedBetrag.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
                {qty != null && rate != null && (
                  <span className="text-muted-foreground text-xs ml-2">
                    ({qty} × {rate}{surcharge ? ` × ${surcharge}%` : ''})
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t border-border pt-4 gap-3 justify-end bg-form-header rounded-b-lg">
          <Button type="button" variant="outline" onClick={onClose} className="text-sm">
            Abbrechen
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-emerald hover:bg-emerald-dark text-white gap-2 text-sm"
          >
            {mutation.isPending ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Speichern...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {editingEntry ? 'Aktualisieren' : 'Hinzufügen'}
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
