/**
 * Hook that ensures default wage entries are seeded on first load.
 * The backend automatically seeds 6 default entries when getAllWageEntries()
 * is called on an empty store (seedDefaultWages flag). This hook triggers
 * that query and exposes loading/error state for UI feedback.
 */
import { useGetAllWageEntries } from './useQueries';

export function useSeedDefaultEntries() {
  const { isLoading, isError, data } = useGetAllWageEntries();

  const isSeeding = isLoading;
  const seedError = isError ? new Error('Fehler beim Laden der Standard-Lohnarten') : null;
  const isSeeded = !isLoading && !isError && Array.isArray(data);

  return { isSeeding, seedError, isSeeded };
}
