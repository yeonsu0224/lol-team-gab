"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { DataDragonBootstrap } from "@/lib/riot/ddragon/types";

interface BootstrapState {
  data: DataDragonBootstrap | null;
  error: string | null;
}

const BootstrapContext = createContext<BootstrapState>({
  data: null,
  error: null,
});

export function BootstrapProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BootstrapState>({
    data: null,
    error: null,
  });

  useEffect(() => {
    let active = true;
    fetch("/api/ddragon/bootstrap")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("bootstrap failed");
        }
        return (await response.json()) as DataDragonBootstrap;
      })
      .then((data) => {
        if (active) {
          setState({ data, error: null });
        }
      })
      .catch(() => {
        if (active) {
          setState({
            data: null,
            error: "이미지 정보를 불러오지 못했습니다.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <BootstrapContext.Provider value={state}>
      {children}
    </BootstrapContext.Provider>
  );
}

export function useBootstrap(): BootstrapState {
  return useContext(BootstrapContext);
}

export function useDataDragonVersion(): string | null {
  return useContext(BootstrapContext).data?.version ?? null;
}
