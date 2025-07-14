"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import type { Credential, ServerData, FetchState, ActionState } from "@/types";
import type { RawUsageStats } from "@/components/monitoring-charts";

export function useKiwiVMApi() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [serverData, setServerData] = useState<Record<string, ServerData>>({});
  const [fetchStates, setFetchStates] = useState<Record<string, FetchState>>({});
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [rawUsageStats, setRawUsageStats] = useState<Record<string, RawUsageStats>>({});
  const [isChartLoading, setChartLoading] = useState<Record<string, boolean>>({});
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  const fetchData = useCallback(async (id: string, cred: Credential, isBackground = false) => {
    setFetchStates(prev => ({
      ...prev,
      [id]: { ...prev[id], loading: !isBackground, refreshing: isBackground, error: null },
    }));
    try {
      const response = await fetch("/api/kiwivm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          veid: cred.veid,
          api_key: cred.api_key,
          action: "getLiveServiceInfo",
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Failed to fetch data");
      setServerData(prev => ({ ...prev, [id]: data }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error(`Failed to fetch data for ${cred.veid}:`, err);
      toast.error(`Error for VEID ${cred.veid}: ${errorMessage}`);
      setFetchStates(prev => ({ ...prev, [id]: { loading: false, refreshing: false, error: errorMessage } }));
    } finally {
      setFetchStates(prev => ({ ...prev, [id]: { ...prev[id], loading: false, refreshing: false } }));
    }
  }, []);

  const fetchUsageStats = useCallback(async (id: string, cred: Credential) => {
    setChartLoading(prev => ({ ...prev, [id]: true }));
    try {
      const response = await fetch("/api/kiwivm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          veid: cred.veid,
          api_key: cred.api_key,
          action: "getRawUsageStats",
        }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "Failed to fetch usage stats");
      setRawUsageStats(prev => ({ ...prev, [id]: data }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error(`Failed to fetch usage stats for ${cred.veid}:`, err);
      toast.error(`Usage stats error for VEID ${cred.veid}: ${errorMessage}`);
    } finally {
      setChartLoading(prev => ({ ...prev, [id]: false }));
    }
  }, []);

  const handleAction = useCallback(async (id: string, action: "start" | "stop" | "restart") => {
    const cred = credentials.find(c => c.id === id);
    if (!cred) return;

    setActionStates(prev => ({ ...prev, [id]: { loading: true, error: null } }));
    toast.loading(`Requesting to ${action} server...`);

    try {
      const response = await fetch("/api/kiwivm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ veid: cred.veid, api_key: cred.api_key, action }),
      });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || `Failed to ${action}`);
      toast.success(`Server is now ${action}ing.`);
      setTimeout(() => fetchData(id, cred), 5000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error(`Failed to ${action} for ${cred.veid}:`, err);
      toast.error(`Action failed for VEID ${cred.veid}: ${errorMessage}`);
      setActionStates(prev => ({ ...prev, [id]: { loading: false, error: errorMessage } }));
    } finally {
      setActionStates(prev => ({ ...prev, [id]: { ...prev[id], loading: false } }));
    }
  }, [credentials, fetchData]);

  const addCredential = (veid: string, api_key: string) => {
    if (credentials.some(c => c.veid === veid)) {
      toast.error("This VEID already exists.");
      return;
    }
    const newCredential = { id: self.crypto.randomUUID(), veid, api_key };
    const newCreds = [...credentials, newCredential];
    setCredentials(newCreds);
    localStorage.setItem("kiwivm-creds", JSON.stringify(newCreds));
    toast.success("Account added successfully!");
  };

  const removeCredential = (id: string) => {
    const newCreds = credentials.filter((c) => c.id !== id);
    setCredentials(newCreds);
    localStorage.setItem("kiwivm-creds", JSON.stringify(newCreds));
    setServerData(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    setFetchStates(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
    if (selectedCredentialId === id) {
      setSelectedCredentialId(newCreds.length > 0 ? newCreds[0].id : null);
    }
    toast.info("Account removed.");
  };

  useEffect(() => {
    setIsClient(true);
    try {
      const storedCreds = localStorage.getItem("kiwivm-creds");
      if (storedCreds) {
        const parsedCreds = JSON.parse(storedCreds);
        setCredentials(parsedCreds);
        if (parsedCreds.length > 0) {
          setSelectedCredentialId(parsedCreds[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to parse credentials from localStorage", error);
      toast.error("Could not load credentials from storage.");
    }
  }, []);

  // Initial load and credential changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem("kiwivm-creds", JSON.stringify(credentials));
      if (credentials.length > 0) {
        credentials.forEach(cred => fetchData(cred.id, cred));
      }
    }
  }, [isClient, credentials, fetchData]);

  // Fetch usage stats only for the selected server
  useEffect(() => {
    if (selectedCredentialId) {
      const cred = credentials.find(c => c.id === selectedCredentialId);
      if (cred) {
        fetchUsageStats(cred.id, cred);
      }
    }
  }, [selectedCredentialId, credentials, fetchUsageStats]);

  return {
    credentials,
    serverData,
    fetchStates,
    actionStates,
    rawUsageStats,
    isChartLoading,
    selectedCredentialId,
    isClient,
    addCredential,
    removeCredential,
    handleAction,
    setSelectedCredentialId,
    fetchData,
    fetchUsageStats,
  };
}
