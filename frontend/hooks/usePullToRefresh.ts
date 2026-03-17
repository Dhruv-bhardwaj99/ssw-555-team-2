import { useCallback, useState } from "react";

export function usePullToRefresh(onRefreshWork?: () => void | Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await onRefreshWork?.();
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshWork]);

  return { refreshing, onRefresh };
}