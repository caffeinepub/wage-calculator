import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Summary {
    nettoentgelt: number;
    avBeitrag: number;
    rvBeitrag: number;
    svBrutto: number;
    kvBeitrag: number;
    pvBeitrag: number;
    steuerBrutto: number;
    abrechnungsBrutto: number;
    auszahlungsbetrag: number;
}
export interface WageEntry {
    percentageSurcharge?: number;
    rate?: number;
    description: string;
    socialInsuranceFlag: string;
    taxableBenefitFlag: string;
    wageTypeCode: string;
    quantity?: number;
    amount: number;
    taxFlag: string;
}
export interface backendInterface {
    addOrUpdateWageEntry(wageTypeCode: string, description: string, quantity: number | null, rate: number | null, percentageSurcharge: number | null, taxFlag: string, socialInsuranceFlag: string, taxableBenefitFlag: string, amount: number | null): Promise<void>;
    deleteWageEntry(wageTypeCode: string): Promise<void>;
    getAllWageEntries(): Promise<Array<WageEntry>>;
    getLohnsteuer(): Promise<number>;
    getSummary(): Promise<Summary>;
    getWageEntry(wageTypeCode: string): Promise<WageEntry>;
    setLohnsteuer(value: number): Promise<void>;
}
