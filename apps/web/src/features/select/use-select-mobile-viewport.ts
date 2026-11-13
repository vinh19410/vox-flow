import { useSyncExternalStore } from "react";

export const SELECT_MOBILE_QUERY = "(max-width: 1023.98px)";

/** Returns true when the current viewport is below the 1024px select breakpoint. */
export function isSelectMobileViewport(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    Boolean(window.matchMedia(SELECT_MOBILE_QUERY)?.matches)
  );
}

const getServerSnapshot = () => false;

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const mql = window.matchMedia(SELECT_MOBILE_QUERY);
  if (!mql) {
    return () => {};
  }
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", onStoreChange);
    return () => {
      mql.removeEventListener?.("change", onStoreChange);
    };
  }
  if (typeof mql.addListener === "function") {
    mql.addListener(onStoreChange);
    return () => {
      mql.removeListener?.(onStoreChange);
    };
  }
  return () => {};
}

/** Reactively tracks whether the viewport matches the mobile select breakpoint (< 1024px). */
export function useSelectMobileViewport(): boolean {
  return useSyncExternalStore(subscribe, isSelectMobileViewport, getServerSnapshot);
}
