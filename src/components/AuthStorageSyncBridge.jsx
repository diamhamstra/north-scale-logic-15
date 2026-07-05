import { useAuthStorageSync } from '@/hooks/useAuthStorageSync';

/** Keeps AuthContext and React Query in sync when another tab changes session keys. */
export default function AuthStorageSyncBridge() {
  useAuthStorageSync();
  return null;
}
