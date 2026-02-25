import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { WageEntry, Summary } from '../backend';

export const WAGE_ENTRIES_KEY = ['wageEntries'];
export const SUMMARY_KEY = ['summary'];
export const LOHNSTEUER_KEY = ['lohnsteuer'];

export function useGetAllWageEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<WageEntry[]>({
    queryKey: WAGE_ENTRIES_KEY,
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllWageEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export interface WageEntryInput {
  wageTypeCode: string;
  description: string;
  quantity: number | null;
  rate: number | null;
  percentageSurcharge: number | null;
  taxFlag: string;
  socialInsuranceFlag: string;
  taxableBenefitFlag: string;
  amount: number | null;
}

export function useAddOrUpdateWageEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WageEntryInput) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.addOrUpdateWageEntry(
        input.wageTypeCode,
        input.description,
        input.quantity,
        input.rate,
        input.percentageSurcharge,
        input.taxFlag,
        input.socialInsuranceFlag,
        input.taxableBenefitFlag,
        input.amount,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAGE_ENTRIES_KEY });
      queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
    },
  });
}

export function useDeleteWageEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (wageTypeCode: string) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.deleteWageEntry(wageTypeCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAGE_ENTRIES_KEY });
      queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
    },
  });
}

export function useSummary() {
  const { actor, isFetching } = useActor();

  return useQuery<Summary>({
    queryKey: SUMMARY_KEY,
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getSummary();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useLohnsteuer() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: LOHNSTEUER_KEY,
    queryFn: async () => {
      if (!actor) return 0;
      return actor.getLohnsteuer();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetLohnsteuer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (value: number) => {
      if (!actor) throw new Error('Actor not initialized');
      await actor.setLohnsteuer(value);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LOHNSTEUER_KEY });
      queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
    },
  });
}

export function calculateBetrag(
  quantity: number | null,
  rate: number | null,
  percentageSurcharge: number | null,
): number {
  if (quantity == null || rate == null) return 0;
  if (percentageSurcharge != null && percentageSurcharge > 0) {
    return quantity * rate * (percentageSurcharge / 100);
  }
  return quantity * rate;
}
