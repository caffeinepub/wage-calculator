import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileSpreadsheet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

// ────────────────────────────────────────────────────────────
//  PAP Lohnsteuer 2026 – vereinfachte Implementierung
// ────────────────────────────────────────────────────────────

const KIRCHENSTEUER_SATZ: Record<string, number> = {
  keine: 0,
  "Baden-Württemberg": 0.08,
  Bayern: 0.08,
  Berlin: 0.09,
  Brandenburg: 0.09,
  Bremen: 0.09,
  Hamburg: 0.09,
  Hessen: 0.09,
  "Mecklenburg-Vorpommern": 0.09,
  Niedersachsen: 0.09,
  "Nordrhein-Westfalen": 0.09,
  "Rheinland-Pfalz": 0.09,
  Saarland: 0.09,
  Sachsen: 0.09,
  "Sachsen-Anhalt": 0.09,
  "Schleswig-Holstein": 0.09,
  Thüringen: 0.09,
};

// Lohnsteuer-Tabelle 2026 (vereinfacht, Jahreswerte)
function berechneLohnsteuerJahr(zve: number, steuerklasse: string): number {
  if (zve <= 0) return 0;

  // Grundfreibetrag 2026
  const grundfreibetrag = 11784;
  const kinderfreibetrag = 0; // wird separat berücksichtigt

  let steuerpflichtig = Math.max(0, zve - grundfreibetrag - kinderfreibetrag);

  let steuer = 0;

  if (steuerklasse === "III") {
    // Steuerklasse III: Splitting-Tarif (Faktor 2 dann halbieren)
    steuerpflichtig = Math.max(0, zve - 2 * grundfreibetrag);
    const half = steuerpflichtig / 2;
    steuer = 2 * berechneTarif(half);
  } else if (steuerklasse === "II") {
    // Alleinerziehendfreibetrag ~4260
    steuerpflichtig = Math.max(0, zve - grundfreibetrag - 4260);
    steuer = berechneTarif(steuerpflichtig);
  } else if (steuerklasse === "V" || steuerklasse === "VI") {
    // Steuerklasse V/VI: kein Grundfreibetrag
    steuerpflichtig = zve;
    // Steuerklasse V: kein Grundfreibetrag, aber effektiv höhere Steuer
    if (steuerklasse === "V") {
      const steuerIII = berechneLohnsteuerJahr(zve, "III");
      const steuerI = berechneLohnsteuerJahr(zve, "I");
      steuer = Math.max(0, 2 * steuerI - steuerIII);
    } else {
      // Steuerklasse VI: Pauschale ohne Freibeträge
      steuer = berechneTarif(zve) * 1.25;
    }
  } else {
    // I und IV
    steuer = berechneTarif(steuerpflichtig);
  }

  return Math.max(0, Math.floor(steuer * 100) / 100);
}

function berechneTarif(x: number): number {
  if (x <= 0) return 0;
  // Steuertarif 2026 (Eckwerte)
  const x1 = 17006;
  const x2 = 66761;
  const x3 = 277826;
  if (x <= x1) {
    const y = (x - 11784) / 10000;
    if (y <= 0) return 0;
    return (922.98 * y + 1400) * y;
  }
  if (x <= x2) {
    const y = (x - 17006) / 10000;
    return (181.19 * y + 2397) * y + 1025.38;
  }
  if (x <= x3) {
    return 0.42 * x - 10911.92;
  }
  return 0.45 * x - 19246.4;
}

// ────────────────────────────────────────────────────────────
//  Sozialversicherungs-Konstanten 2026
// ────────────────────────────────────────────────────────────
const KV_BEITRAGSSATZ = 0.146; // allgemeiner Beitrag
// KV_ZUSATZBEITRAG_DEFAULT = 0.017 -- used inline below
const RV_BEITRAGSSATZ = 0.186;
const AV_BEITRAGSSATZ = 0.026;
const PV_BEITRAGSSATZ = 0.034; // mit Kinder
const PV_BEITRAGSSATZ_KINDERLOS = 0.04; // kinderlos über 23

const KV_BBG_MONAT = 5512.5; // 2026
const RV_BBG_MONAT = 8050.0; // 2026 West
const AV_BBG_MONAT = 8050.0;
const PV_BBG_MONAT = 5512.5;

const MINIJOB_GRENZE = 630; // 2026
const GLEITZONE_BIS = 2000;

interface SvResult {
  kv: number;
  kvZusatz: number;
  rv: number;
  av: number;
  pv: number;
  gesamt: number;
}

function berechneSV(
  brutto: number,
  kvGruppe: string,
  rvGruppe: string,
  avGruppe: string,
  pvGruppe: string,
  kinderlos: boolean,
  kvZusatzProzent: number,
): SvResult {
  if (brutto <= MINIJOB_GRENZE) {
    return { kv: 0, kvZusatz: 0, rv: 0, av: 0, pv: 0, gesamt: 0 };
  }

  let effektivBrutto = brutto;

  // Gleitzone
  if (brutto > MINIJOB_GRENZE && brutto <= GLEITZONE_BIS) {
    // F-Faktor: vereinfacht linearer Anstieg
    const f = 0.6619;
    effektivBrutto =
      brutto *
      (GLEITZONE_BIS / (GLEITZONE_BIS - MINIJOB_GRENZE) -
        (MINIJOB_GRENZE * f) / (GLEITZONE_BIS - MINIJOB_GRENZE));
    effektivBrutto = Math.max(MINIJOB_GRENZE, Math.min(effektivBrutto, brutto));
  }

  const kvBasis = Math.min(brutto, KV_BBG_MONAT);
  const rvBasis = Math.min(brutto, RV_BBG_MONAT);
  const avBasis = Math.min(brutto, AV_BBG_MONAT);
  const pvBasis = Math.min(brutto, PV_BBG_MONAT);

  let kv = 0;
  let kvZusatz = 0;
  let rv = 0;
  let av = 0;
  let pv = 0;

  if (kvGruppe.startsWith("1")) {
    kv = kvBasis * (KV_BEITRAGSSATZ / 2);
    kvZusatz = kvBasis * (kvZusatzProzent / 2);
  }

  if (rvGruppe.startsWith("1")) {
    rv = rvBasis * (RV_BEITRAGSSATZ / 2);
  } else if (rvGruppe.startsWith("3")) {
    rv = rvBasis * (RV_BEITRAGSSATZ / 2) * 0.5;
  }

  if (avGruppe.startsWith("1")) {
    av = avBasis * (AV_BEITRAGSSATZ / 2);
  }

  if (pvGruppe.startsWith("1")) {
    const pvSatz = kinderlos ? PV_BEITRAGSSATZ_KINDERLOS : PV_BEITRAGSSATZ;
    pv = pvBasis * (pvSatz / 2);
  }

  const gesamt = kv + kvZusatz + rv + av + pv;
  return {
    kv: Math.round(kv * 100) / 100,
    kvZusatz: Math.round(kvZusatz * 100) / 100,
    rv: Math.round(rv * 100) / 100,
    av: Math.round(av * 100) / 100,
    pv: Math.round(pv * 100) / 100,
    gesamt: Math.round(gesamt * 100) / 100,
  };
}

// ────────────────────────────────────────────────────────────
//  Hauptkomponente
// ────────────────────────────────────────────────────────────

const AOK_LISTE = [
  "AOK Baden-Württemberg",
  "AOK Bayern",
  "AOK Berlin",
  "AOK Brandenburg",
  "AOK Bremen/Bremerhaven",
  "AOK Hessen",
  "AOK Niedersachsen",
  "AOK NordWest",
  "AOK PLUS (Sachsen/Thüringen)",
  "AOK Rheinland-Pfalz/Saarland",
  "AOK Rheinland/Hamburg",
  "AOK Sachsen-Anhalt",
];

const BUNDESLAENDER = [
  "Baden-Württemberg",
  "Bayern",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hessen",
  "Mecklenburg-Vorpommern",
  "Niedersachsen",
  "Nordrhein-Westfalen",
  "Rheinland-Pfalz",
  "Saarland",
  "Sachsen",
  "Sachsen-Anhalt",
  "Schleswig-Holstein",
  "Thüringen",
];

const KINDERFREIBETRAEGE = [
  "0",
  "0.5",
  "1",
  "1.5",
  "2",
  "2.5",
  "3",
  "3.5",
  "4",
  "4.5",
  "5",
  "5.5",
  "6",
];

const BEITRAGSGRUPPE_KV = [
  "1 - KV-Pflicht, allgemeiner Beitrag",
  "2 - KV-Pflicht, ermäßigter Beitrag",
  "4 - KV-Pflicht, Beitrag für Rentner",
  "0 - KV-frei",
];

const BEITRAGSGRUPPE_RV = [
  "1 - RV-Pflicht, voller Beitrag",
  "3 - RV-Pflicht, halber Beitrag",
  "5 - RV-Pflicht, Beitrag für Rentner",
  "0 - RV-frei",
];

const BEITRAGSGRUPPE_AV = ["1 - AV-Pflicht, voller Beitrag", "0 - AV-frei"];

const BEITRAGSGRUPPE_PV = ["1 - PV-Pflicht", "0 - PV-frei"];

function fmtEur(val: number): string {
  return `${val.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} €`;
}

function parseBrutto(val: string): number {
  const clean = val
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");
  const parsed = Number.parseFloat(clean);
  return Number.isNaN(parsed) ? 0 : parsed;
}

const LS_PREFIX = "aok_";

function loadPref<T>(key: string, fallback: T): T {
  try {
    const val = localStorage.getItem(LS_PREFIX + key);
    if (val === null) return fallback;
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

function savePref(key: string, value: unknown) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
  } catch {
    /* noop */
  }
}

export default function AokCalculator() {
  const [aok, setAok] = useState(() =>
    loadPref("aok", "AOK Rheinland/Hamburg"),
  );
  const [zeitraum, setZeitraum] = useState<"jahr" | "monat" | "teilmonat">(() =>
    loadPref("zeitraum", "monat"),
  );
  const [bruttoInput, setBruttoInput] = useState(() =>
    loadPref("brutto", "3.590,00"),
  );
  const [umstaende, setUmstaende] = useState(() =>
    loadPref("umstaende", "nein"),
  );
  const [berufsausbildung, setBerufsausbildung] = useState(() =>
    loadPref("berufsausbildung", false),
  );
  const [beschort, setBeschort] = useState(() => loadPref("beschort", ""));
  const [kinderlos, setKinderlos] = useState(() =>
    loadPref("kinderlos", false),
  );
  const [steuerklasse, setSteuerklasse] = useState(() =>
    loadPref("steuerklasse", "I"),
  );
  const [kinderfreibetrag, setKinderfreibetrag] = useState(() =>
    loadPref("kinderfreibetrag", "0"),
  );
  const [kirchensteuer, setKirchensteuer] = useState(() =>
    loadPref("kirchensteuer", "keine"),
  );
  const [geburtsjahr, setGeburtsjahr] = useState(() =>
    loadPref("geburtsjahr", "nach 1961"),
  );
  const [altersentlastung, setAltersentlastung] = useState(() =>
    loadPref("altersentlastung", false),
  );
  const [kvGruppe, setKvGruppe] = useState(() =>
    loadPref("kvGruppe", BEITRAGSGRUPPE_KV[0]),
  );
  const [rvGruppe, setRvGruppe] = useState(() =>
    loadPref("rvGruppe", BEITRAGSGRUPPE_RV[0]),
  );
  const [avGruppe, setAvGruppe] = useState(() =>
    loadPref("avGruppe", BEITRAGSGRUPPE_AV[0]),
  );
  const [pvGruppe, setPvGruppe] = useState(() =>
    loadPref("pvGruppe", BEITRAGSGRUPPE_PV[0]),
  );

  // Persist all fields
  useEffect(() => {
    savePref("aok", aok);
  }, [aok]);
  useEffect(() => {
    savePref("zeitraum", zeitraum);
  }, [zeitraum]);
  useEffect(() => {
    savePref("brutto", bruttoInput);
  }, [bruttoInput]);
  useEffect(() => {
    savePref("umstaende", umstaende);
  }, [umstaende]);
  useEffect(() => {
    savePref("berufsausbildung", berufsausbildung);
  }, [berufsausbildung]);
  useEffect(() => {
    savePref("beschort", beschort);
  }, [beschort]);
  useEffect(() => {
    savePref("kinderlos", kinderlos);
  }, [kinderlos]);
  useEffect(() => {
    savePref("steuerklasse", steuerklasse);
  }, [steuerklasse]);
  useEffect(() => {
    savePref("kinderfreibetrag", kinderfreibetrag);
  }, [kinderfreibetrag]);
  useEffect(() => {
    savePref("kirchensteuer", kirchensteuer);
  }, [kirchensteuer]);
  useEffect(() => {
    savePref("geburtsjahr", geburtsjahr);
  }, [geburtsjahr]);
  useEffect(() => {
    savePref("altersentlastung", altersentlastung);
  }, [altersentlastung]);
  useEffect(() => {
    savePref("kvGruppe", kvGruppe);
  }, [kvGruppe]);
  useEffect(() => {
    savePref("rvGruppe", rvGruppe);
  }, [rvGruppe]);
  useEffect(() => {
    savePref("avGruppe", avGruppe);
  }, [avGruppe]);
  useEffect(() => {
    savePref("pvGruppe", pvGruppe);
  }, [pvGruppe]);

  // ── Berechnung ──────────────────────────────────────────────
  const berechne = useCallback(() => {
    const brutto = parseBrutto(bruttoInput);
    if (brutto <= 0) return null;

    // Monatsbasis
    const bruttoMonat = zeitraum === "jahr" ? brutto / 12 : brutto;
    const bruttoJahr = bruttoMonat * 12;

    // Kinderfreibetrag ZVE-Minderung
    const kfb = Number.parseFloat(kinderfreibetrag) * 4332; // 2026: 4332€ je 0.5 KFB
    const zve = Math.max(0, bruttoJahr - kfb);

    // Altersentlastungsbetrag
    const aeb =
      altersentlastung && geburtsjahr === "1961 und früher"
        ? Math.min(0.408 * bruttoJahr, 2052)
        : 0;
    const zveNachAeb = Math.max(0, zve - aeb);

    // Lohnsteuer (Jahresbetrag)
    const lstJahr = berechneLohnsteuerJahr(zveNachAeb, steuerklasse);
    const lstMonat = lstJahr / 12;

    // Solidaritätszuschlag (5.5% der LSt, aber nur bei LSt > 18130/12 = 1510.83 im Monat)
    const soliSchwelleMonat = 1510.83;
    let soliMonat = 0;
    if (lstMonat > soliSchwelleMonat) {
      soliMonat = lstMonat * 0.055;
    } else if (lstMonat > 0) {
      // Milderungszone: vereinfacht
      soliMonat = Math.min(
        lstMonat * 0.055,
        Math.max(0, (lstMonat - soliSchwelleMonat * 0.9) * 0.2),
      );
    }

    // Kirchensteuer
    const kstSatz =
      kirchensteuer !== "keine"
        ? (KIRCHENSTEUER_SATZ[kirchensteuer] ?? 0.09)
        : 0;
    const kstMonat = lstMonat * kstSatz;

    const steuernGesamt = lstMonat + kstMonat + soliMonat;

    // SV
    const aokZusatz = 0.017; // Standard-AOK-Zusatzbeitrag
    const sv = berechneSV(
      bruttoMonat,
      kvGruppe,
      rvGruppe,
      avGruppe,
      pvGruppe,
      kinderlos,
      aokZusatz,
    );

    const netto = bruttoMonat - steuernGesamt - sv.gesamt;

    return {
      brutto: bruttoMonat,
      lst: lstMonat,
      kst: kstMonat,
      soli: soliMonat,
      steuernGesamt,
      kv: sv.kv,
      kvZusatz: sv.kvZusatz,
      rv: sv.rv,
      av: sv.av,
      pv: sv.pv,
      svGesamt: sv.gesamt,
      netto: Math.max(0, netto),
    };
  }, [
    bruttoInput,
    zeitraum,
    steuerklasse,
    kinderfreibetrag,
    kirchensteuer,
    geburtsjahr,
    altersentlastung,
    kvGruppe,
    rvGruppe,
    avGruppe,
    pvGruppe,
    kinderlos,
  ]);

  const ergebnis = berechne();

  // ── Excel Export ─────────────────────────────────────────────
  const exportExcel = () => {
    if (!ergebnis) return;
    const rows = [
      ["AOK Lohnrechner 2026", ""],
      ["", ""],
      ["Bruttolohn", ergebnis.brutto],
      ["Lohnsteuer", -ergebnis.lst],
      ["Kirchensteuer", -ergebnis.kst],
      ["Solidaritätszuschlag", -ergebnis.soli],
      ["Steuern gesamt", -ergebnis.steuernGesamt],
      ["Krankenversicherung", -ergebnis.kv],
      ["Zusatzbeitrag", -ergebnis.kvZusatz],
      ["Rentenversicherung", -ergebnis.rv],
      ["Arbeitslosenversicherung", -ergebnis.av],
      ["Pflegeversicherung", -ergebnis.pv],
      ["Sozialabgaben gesamt", -ergebnis.svGesamt],
      ["Nettogehalt", ergebnis.netto],
    ];

    let csv = rows
      .map((r) => r.map((c) => String(c).replace(",", ".")).join(";"))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "AOK_Lohnrechner.csv";
    a.click();
  };

  // ── PDF Export (via print) ───────────────────────────────────
  const exportPdf = () => {
    if (!ergebnis) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>AOK Lohnrechner 2026</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; font-size: 13px; }
        h1 { font-size: 18px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 6px 10px; border-bottom: 1px solid #eee; }
        td:last-child { text-align: right; font-family: monospace; }
        .section { background: #f5f5f5; font-weight: bold; }
        .total { background: #003a6b; color: white; font-weight: bold; font-size: 14px; }
      </style>
      </head><body>
      <h1>AOK Lohnrechner 2026</h1>
      <table>
        <tr class="section"><td colspan="2">Bruttolohn</td><td>${fmtEur(ergebnis.brutto)}</td></tr>
        <tr><td colspan="2">− Lohnsteuer</td><td>${fmtEur(ergebnis.lst)}</td></tr>
        <tr><td colspan="2">− Kirchensteuer</td><td>${fmtEur(ergebnis.kst)}</td></tr>
        <tr><td colspan="2">− Solidaritätszuschlag</td><td>${fmtEur(ergebnis.soli)}</td></tr>
        <tr class="section"><td colspan="2">Steuern gesamt</td><td>${fmtEur(ergebnis.steuernGesamt)}</td></tr>
        <tr><td colspan="2">− Krankenversicherung</td><td>${fmtEur(ergebnis.kv)}</td></tr>
        <tr><td colspan="2">− Zusatzbeitrag</td><td>${fmtEur(ergebnis.kvZusatz)}</td></tr>
        <tr><td colspan="2">− Rentenversicherung</td><td>${fmtEur(ergebnis.rv)}</td></tr>
        <tr><td colspan="2">− Arbeitslosenversicherung</td><td>${fmtEur(ergebnis.av)}</td></tr>
        <tr><td colspan="2">− Pflegeversicherung</td><td>${fmtEur(ergebnis.pv)}</td></tr>
        <tr class="section"><td colspan="2">Sozialabgaben gesamt</td><td>${fmtEur(ergebnis.svGesamt)}</td></tr>
        <tr class="total"><td colspan="2">Nettogehalt</td><td>${fmtEur(ergebnis.netto)}</td></tr>
      </table>
      <script>window.print();window.close();</script>
      </body></html>
    `);
    win.document.close();
  };

  // ── UI ────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          AOK Brutto-Netto-Rechner
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Berechnen Sie Ihr Nettogehalt auf Basis der gesetzlichen Abgaben 2026
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Eingabe-Seite ── */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              Eingabe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="arbeitnehmer">
              <TabsList className="w-full mb-5 bg-muted rounded-md">
                <TabsTrigger
                  value="arbeitnehmer"
                  className="flex-1 text-xs font-medium"
                  data-ocid="aok.arbeitnehmer.tab"
                >
                  Arbeitnehmer
                </TabsTrigger>
                <TabsTrigger
                  value="arbeitgeber"
                  className="flex-1 text-xs font-medium"
                  data-ocid="aok.arbeitgeber.tab"
                >
                  Arbeitgeber
                </TabsTrigger>
                <TabsTrigger
                  value="weitere"
                  className="flex-1 text-xs font-medium"
                  data-ocid="aok.weitere.tab"
                >
                  weitere Angaben
                </TabsTrigger>
              </TabsList>

              {/* ── Tab: Arbeitnehmer ── */}
              <TabsContent value="arbeitnehmer" className="space-y-4 mt-0">
                {/* AOK */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Ihre zuständige AOK
                  </Label>
                  <Select value={aok} onValueChange={setAok}>
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid="aok.aok_select.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AOK_LISTE.map((a) => (
                        <SelectItem key={a} value={a}>
                          {a}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Zeitraum */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Berechnungszeitraum
                  </Label>
                  <RadioGroup
                    value={zeitraum}
                    onValueChange={(v) =>
                      setZeitraum(v as "jahr" | "monat" | "teilmonat")
                    }
                    className="flex gap-4"
                    data-ocid="aok.zeitraum.radio"
                  >
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="jahr" id="z-jahr" />
                      <Label
                        htmlFor="z-jahr"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Jahr
                      </Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="monat" id="z-monat" />
                      <Label
                        htmlFor="z-monat"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Monat
                      </Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="teilmonat" id="z-teilmonat" />
                      <Label
                        htmlFor="z-teilmonat"
                        className="text-sm font-normal cursor-pointer"
                      >
                        Teilmonat
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Bruttolohn */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label
                    htmlFor="brutto-input"
                    className="text-sm text-foreground/80 text-right"
                  >
                    Bruttogehalt
                  </Label>
                  <div className="relative">
                    <Input
                      id="brutto-input"
                      value={bruttoInput}
                      onChange={(e) => setBruttoInput(e.target.value)}
                      className="h-8 text-sm pr-8 bg-yellow-50 border-yellow-300 focus:border-emerald-500 focus:ring-emerald-500 font-mono font-semibold text-right"
                      placeholder="0,00"
                      data-ocid="aok.brutto.input"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      €
                    </span>
                  </div>
                </div>

                {/* Umstände */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Umständige oder befristete Beschäftigung
                  </Label>
                  <Select value={umstaende} onValueChange={setUmstaende}>
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid="aok.umstaende.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nein">nein</SelectItem>
                      <SelectItem value="ja">ja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Berufsausbildung */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Beschäftigung in der Berufsausbildung
                  </Label>
                  <div className="flex items-center">
                    <Checkbox
                      id="berufsausbildung"
                      checked={berufsausbildung}
                      onCheckedChange={(c) => setBerufsausbildung(!!c)}
                      data-ocid="aok.berufsausbildung.checkbox"
                    />
                  </div>
                </div>

                {/* Beschäftigungsort */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Beschäftigungsort
                  </Label>
                  <Select
                    value={beschort || "__"}
                    onValueChange={(v) => setBeschort(v === "__" ? "" : v)}
                  >
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid="aok.beschort.select"
                    >
                      <SelectValue placeholder="Bitte auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__">Bitte auswählen</SelectItem>
                      {BUNDESLAENDER.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Pflegeversicherung Beitragszuschlag */}
                <div className="grid grid-cols-[180px_1fr] items-start gap-3">
                  <Label className="text-sm text-foreground/80 text-right pt-1">
                    Beitragszuschlag zur Pflegeversicherung
                  </Label>
                  <RadioGroup
                    value={kinderlos ? "kinderlos" : "kinder"}
                    onValueChange={(v) => setKinderlos(v === "kinderlos")}
                    className="space-y-1.5"
                    data-ocid="aok.pflegezuschlag.radio"
                  >
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="kinderlos" id="pv-kinderlos" />
                      <Label
                        htmlFor="pv-kinderlos"
                        className="text-sm font-normal cursor-pointer"
                      >
                        ja, über 23 Jahre und kinderlos
                      </Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <RadioGroupItem value="kinder" id="pv-kinder" />
                      <Label
                        htmlFor="pv-kinder"
                        className="text-sm font-normal cursor-pointer"
                      >
                        nein, unter 23 Jahre oder Kinder
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Steuerklasse */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Lohnsteuerklasse
                  </Label>
                  <RadioGroup
                    value={steuerklasse}
                    onValueChange={setSteuerklasse}
                    className="flex gap-3 flex-wrap"
                    data-ocid="aok.steuerklasse.radio"
                  >
                    {["I", "II", "III", "IV", "V", "VI"].map((sk) => (
                      <div key={sk} className="flex items-center gap-1">
                        <RadioGroupItem value={sk} id={`sk-${sk}`} />
                        <Label
                          htmlFor={`sk-${sk}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {sk}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Kinderfreibetrag */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Kinderfreibeträge
                  </Label>
                  <Select
                    value={kinderfreibetrag}
                    onValueChange={setKinderfreibetrag}
                  >
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid="aok.kinderfreibetrag.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KINDERFREIBETRAEGE.map((k) => (
                        <SelectItem key={k} value={k}>
                          {k}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Kirchensteuer */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Kirchensteuer
                  </Label>
                  <Select
                    value={kirchensteuer}
                    onValueChange={setKirchensteuer}
                  >
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid="aok.kirchensteuer.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keine">keine Kirchensteuer</SelectItem>
                      {BUNDESLAENDER.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Geburtsjahr */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Geburtsjahr
                  </Label>
                  <Select value={geburtsjahr} onValueChange={setGeburtsjahr}>
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid="aok.geburtsjahr.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nach 1961">nach 1961</SelectItem>
                      <SelectItem value="1961 und früher">
                        1961 und früher
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Altersentlastungsbetrag */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Altersentlastungsbetrag
                  </Label>
                  <div className="flex items-center">
                    <Checkbox
                      id="altersentlastung"
                      checked={altersentlastung}
                      onCheckedChange={(c) => setAltersentlastung(!!c)}
                      data-ocid="aok.altersentlastung.checkbox"
                    />
                  </div>
                </div>

                <Separator />

                {/* Beitragsgruppe KV */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Beitragsgruppe KV
                  </Label>
                  <Select value={kvGruppe} onValueChange={setKvGruppe}>
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid="aok.kv_gruppe.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BEITRAGSGRUPPE_KV.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Beitragsgruppe RV */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Beitragsgruppe RV
                  </Label>
                  <Select value={rvGruppe} onValueChange={setRvGruppe}>
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid="aok.rv_gruppe.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BEITRAGSGRUPPE_RV.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Beitragsgruppe AV */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Beitragsgruppe AV
                  </Label>
                  <Select value={avGruppe} onValueChange={setAvGruppe}>
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid="aok.av_gruppe.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BEITRAGSGRUPPE_AV.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Beitragsgruppe PV */}
                <div className="grid grid-cols-[180px_1fr] items-center gap-3">
                  <Label className="text-sm text-foreground/80 text-right">
                    Beitragsgruppe PV
                  </Label>
                  <Select value={pvGruppe} onValueChange={setPvGruppe}>
                    <SelectTrigger
                      className="h-8 text-sm"
                      data-ocid="aok.pv_gruppe.select"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BEITRAGSGRUPPE_PV.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* ── Tab: Arbeitgeber ── */}
              <TabsContent value="arbeitgeber" className="mt-0">
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Arbeitgeberdaten werden in einer späteren Version verfügbar
                  sein.
                </div>
              </TabsContent>

              {/* ── Tab: Weitere Angaben ── */}
              <TabsContent value="weitere" className="mt-0">
                <div className="text-center py-10 text-muted-foreground text-sm">
                  Weitere Angaben werden in einer späteren Version verfügbar
                  sein.
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* ── Ergebnis-Seite ── */}
        <Card className="border border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-foreground">
              Ergebnis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ergebnis ? (
              <div className="space-y-0">
                {/* Brutto */}
                <div className="flex justify-between items-center py-2 border-b border-border/60">
                  <span className="text-sm text-foreground font-medium">
                    Bruttogehalt
                  </span>
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {fmtEur(ergebnis.brutto)}
                  </span>
                </div>

                {/* Steuern */}
                <div className="pt-2 pb-1">
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-muted-foreground pl-2">
                      − Lohnsteuer
                    </span>
                    <span className="font-mono text-sm text-foreground">
                      {fmtEur(ergebnis.lst)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-muted-foreground pl-2">
                      − Kirchensteuer
                    </span>
                    <span className="font-mono text-sm text-foreground">
                      {fmtEur(ergebnis.kst)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-muted-foreground pl-2">
                      − Solidaritätszuschlag
                    </span>
                    <span className="font-mono text-sm text-foreground">
                      {fmtEur(ergebnis.soli)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-border/60 border-b border-border/60 bg-muted/40 px-2 -mx-1 rounded">
                  <span className="text-sm font-semibold text-foreground">
                    Steuern gesamt
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {fmtEur(ergebnis.steuernGesamt)}
                  </span>
                </div>

                {/* Sozialabgaben */}
                <div className="pt-2 pb-1">
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-muted-foreground pl-2">
                      − Krankenversicherung
                    </span>
                    <span className="font-mono text-sm text-foreground">
                      {fmtEur(ergebnis.kv)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-muted-foreground pl-2">
                      − Zusatzbeitrag
                    </span>
                    <span className="font-mono text-sm text-foreground">
                      {fmtEur(ergebnis.kvZusatz)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-muted-foreground pl-2">
                      − Rentenversicherung
                    </span>
                    <span className="font-mono text-sm text-foreground">
                      {fmtEur(ergebnis.rv)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-muted-foreground pl-2">
                      − Arbeitslosenversicherung
                    </span>
                    <span className="font-mono text-sm text-foreground">
                      {fmtEur(ergebnis.av)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-sm text-muted-foreground pl-2">
                      − Pflegeversicherung
                    </span>
                    <span className="font-mono text-sm text-foreground">
                      {fmtEur(ergebnis.pv)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-border/60 border-b border-border/60 bg-muted/40 px-2 -mx-1 rounded">
                  <span className="text-sm font-semibold text-foreground">
                    Sozialabgaben gesamt
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {fmtEur(ergebnis.svGesamt)}
                  </span>
                </div>

                {/* Nettogehalt */}
                <div
                  className="flex justify-between items-center py-3 mt-3 rounded-md px-4 -mx-1"
                  style={{
                    backgroundColor: "oklch(0.22 0.04 260)",
                    color: "white",
                  }}
                  data-ocid="aok.netto.panel"
                >
                  <span className="text-sm font-bold">Nettogehalt</span>
                  <span className="font-mono text-base font-bold">
                    {fmtEur(ergebnis.netto)}
                  </span>
                </div>

                {/* Download Buttons */}
                <div className="flex gap-3 mt-5 pt-4 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportPdf}
                    className="flex-1 gap-2 text-xs"
                    data-ocid="aok.pdf.button"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF-Datei
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportExcel}
                    className="flex-1 gap-2 text-xs"
                    data-ocid="aok.excel.button"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Excel-Datei
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground mt-3 leading-snug">
                  * Dieser Rechner dient als Orientierungshilfe. Bitte
                  überprüfen Sie Ihre Berechnung auf Basis der offiziellen
                  Programmablaufpläne (PAP) des BMF 2026.
                </p>
              </div>
            ) : (
              <div
                className="flex items-center justify-center h-40 text-muted-foreground text-sm"
                data-ocid="aok.result.empty_state"
              >
                Bitte Bruttogehalt eingeben
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
