"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ModeToggle } from "@/components/mode-toggle";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  PlusCircle,
  Loader2,
  Server,
  MoreVertical,
  Play,
  StopCircle,
  RefreshCw,
  Globe,
  HardDrive,
  MemoryStick,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MonitoringCharts, RawUsageStats } from "@/components/monitoring-charts";

interface Credential {
  id: string;
  veid: string;
  api_key: string;
}

interface ServerData {
  hostname: string;
  ip_addresses: string[];
  os: string;
  plan_ram: number;
  mem_available_kb: number;
  ve_used_disk_space_b: number;
  plan_disk: number;
  data_counter: number;
  plan_monthly_data: number;
  monthly_data_multiplier: number;
  data_next_reset: number;
  ve_status: "Running" | "Stopped";
  node_location: string;
  suspended: boolean;
}

interface FetchState {
  loading: boolean;
  refreshing: boolean;
  error: string | null;
}

interface ActionState {
  loading: boolean;
  error: string | null;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export default function Home() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [serverData, setServerData] = useState<Record<string, ServerData>>({});
  const [fetchStates, setFetchStates] = useState<Record<string, FetchState>>({});
  const [actionStates, setActionStates] = useState<Record<string, ActionState>>({});
  const [isClient, setIsClient] = useState(false);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<{ id: string; action: "start" | "stop" | "restart" } | null>(null);
  const [selectedCredentialId, setSelectedCredentialId] = useState<string | null>(null);
  const [rawUsageStats, setRawUsageStats] = useState<Record<string, RawUsageStats>>({});
  const [isChartLoading, setChartLoading] = useState<Record<string, boolean>>({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);

  const fetchData = useCallback(async (id: string, cred: Credential, isBackground = false) => {
    setFetchStates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        loading: !isBackground,
        refreshing: isBackground,
        error: null,
      },
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
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to fetch data");
      }
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

  const fetchDataForAll = useCallback((isBackground = false) => {
    credentials.forEach((cred) => {
      fetchData(cred.id, cred, isBackground);
    });
  }, [credentials, fetchData]);

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
      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to fetch usage stats");
      }
      setRawUsageStats(prev => ({ ...prev, [id]: data }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error(`Failed to fetch usage stats for ${cred.veid}:`, err);
      toast.error(`Usage stats error for VEID ${cred.veid}: ${errorMessage}`);
    } finally {
      setChartLoading(prev => ({ ...prev, [id]: false }));
    }
  }, []);

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

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("kiwivm-creds", JSON.stringify(credentials));
      if (credentials.length > 0) {
        if (!selectedCredentialId && credentials.length > 0) {
          setSelectedCredentialId(credentials[0].id);
        }
        fetchDataForAll();
        credentials.forEach(cred => fetchUsageStats(cred.id, cred));
      }
    }
  }, [credentials, isClient, fetchDataForAll, fetchUsageStats, selectedCredentialId]);

  useEffect(() => {
    if (autoRefresh && credentials.length > 0) {
      const intervalId = setInterval(() => {
        toast.info("Auto-refreshing server data...");
        fetchDataForAll(true);
        if (selectedCredentialId) {
          const cred = credentials.find(c => c.id === selectedCredentialId);
          if (cred) {
            fetchUsageStats(cred.id, cred);
          }
        }
      }, refreshInterval * 1000);
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh, refreshInterval, credentials, fetchDataForAll, fetchUsageStats, selectedCredentialId]);

  const handleActionConfirm = () => {
    if (actionToConfirm) {
      handleAction(actionToConfirm.id, actionToConfirm.action);
      setActionToConfirm(null);
    }
  };

  const openConfirmationDialog = (id: string, action: "start" | "stop" | "restart") => {
    setActionToConfirm({ id, action });
  };

  const handleAction = async (id: string, action: "start" | "stop" | "restart") => {
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

      if (!response.ok || data.error) {
        throw new Error(data.error || `Failed to ${action}`);
      }

      toast.success(`Server is now ${action}ing.`);
      setTimeout(() => fetchData(id, cred), 5000); // Refresh data after 5s
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      console.error(`Failed to ${action} for ${cred.veid}:`, err);
      toast.error(`Action failed for VEID ${cred.veid}: ${errorMessage}`);
      setActionStates(prev => ({ ...prev, [id]: { loading: false, error: errorMessage } }));
    } finally {
      setActionStates(prev => ({ ...prev, [id]: { ...prev[id], loading: false } }));
    }
  };

  const handleAddCredential = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const veid = formData.get("veid") as string;
    const api_key = formData.get("api_key") as string;

    if (veid && api_key) {
      if (credentials.some(c => c.veid === veid)) {
        toast.error("This VEID already exists.");
        return;
      }
      const newCredential = { id: self.crypto.randomUUID(), veid, api_key };
      setCredentials([...credentials, newCredential]);
      toast.success("Account added successfully!");
      setAddDialogOpen(false);
    } else {
      toast.warning("Please fill in both fields.");
    }
  };

  const handleRemoveCredential = (id: string) => {
    setCredentials(credentials.filter((c) => c.id !== id));
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
    toast.info("Account removed.");
  };

  const renderUsageBar = (used: number, total: number, label: string, icon: React.ReactNode) => {
    const percentage = total > 0 ? (used / total) * 100 : 0;
    return (
      <div>
        <div className="flex justify-between items-center mb-1 text-sm">
          <span className="font-medium flex items-center">
            {icon}
            <span className="ml-2">{label}</span>
          </span>
          <span className="text-muted-foreground">{`${formatBytes(used)} / ${formatBytes(total)}`}</span>
        </div>
        <Progress value={percentage} />
      </div>
    );
  };

  return (
    <>
      <header className="container mx-auto py-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Server className="w-8 h-8" />
          KiwiVM Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="auto-refresh" checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            <Label htmlFor="auto-refresh">Auto Refresh</Label>
          </div>
          <Select
            value={String(refreshInterval)}
            onValueChange={(value) => setRefreshInterval(Number(value))}
            disabled={!autoRefresh}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Interval" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15s</SelectItem>
              <SelectItem value="30">30s</SelectItem>
              <SelectItem value="60">1m</SelectItem>
              <SelectItem value="300">5m</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add KiwiVM Account</DialogTitle>
                <DialogDescription>
                  Enter your VEID and API Key to start monitoring.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddCredential}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="veid" className="text-right">VEID</Label>
                    <Input id="veid" name="veid" className="col-span-3" placeholder="1234567" required />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="api_key" className="text-right">API Key</Label>
                    <Input id="api_key" name="api_key" className="col-span-3" placeholder="private_xxxxxxxxxxxx" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Add Account</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <ModeToggle />
        </div>
      </header>

      <main className="container mx-auto pb-10">
        {isClient && credentials.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">No accounts added yet.</p>
            <p className="text-sm text-muted-foreground">Click &quot;Add New Account&quot; to get started.</p>
          </div>
        ) : (
          <div className="flex gap-6">
            <div className="w-1/3 space-y-4">
              {credentials.map((cred) => {
                const data = serverData[cred.id];
                const state = fetchStates[cred.id] || { loading: true, refreshing: false, error: null };
                const actionState = actionStates[cred.id] || { loading: false, error: null };

                if (state.loading && !state.refreshing) {
                  return (
                    <Card key={cred.id}>
                      <CardHeader>
                        <CardTitle>Loading...</CardTitle>
                        <CardDescription>Fetching data for VEID: {cred.veid}</CardDescription>
                      </CardHeader>
                      <CardContent className="flex justify-center items-center p-10">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      </CardContent>
                    </Card>
                  );
                }

                if (state.error && !data) {
                  return (
                    <Card key={cred.id} className="border-destructive">
                      <CardHeader>
                        <CardTitle className="text-destructive">Error</CardTitle>
                        <CardDescription>Could not fetch data for VEID: {cred.veid}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-destructive-foreground bg-destructive/20 p-3 rounded-md">{state.error}</p>
                      </CardContent>
                      <CardFooter className="flex justify-end">
                          <Button variant="destructive" size="sm" onClick={() => handleRemoveCredential(cred.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Remove
                          </Button>
                        </CardFooter>
                    </Card>
                  );
                }
                
                if (!data) return null;

                const statusColor = data.suspended ? "bg-red-500" : data.ve_status === "Running" ? "bg-green-500" : "bg-gray-500";
                const isSelected = selectedCredentialId === cred.id;

                return (
                  <Card key={cred.id} onClick={() => setSelectedCredentialId(cred.id)} className={`cursor-pointer ${isSelected ? 'border-primary' : ''}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${statusColor}`}></span>
                            {data.hostname}
                          </CardTitle>
                          <CardDescription>{data.ip_addresses.join(", ")}</CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {state.refreshing && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                          {actionState.loading && <Loader2 className="h-5 w-5 animate-spin" />}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                              <Server className="w-4 h-4"/>
                              <span>{data.os}</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <Globe className="w-4 h-4"/>
                              <span>{data.node_location}</span>
                          </div>
                      </div>
                      <div className="space-y-3">
                        {renderUsageBar(data.plan_ram - data.mem_available_kb * 1024, data.plan_ram, "RAM", <MemoryStick className="w-4 h-4" />)}
                        {renderUsageBar(data.ve_used_disk_space_b, data.plan_disk, "Disk", <HardDrive className="w-4 h-4" />)}
                        {renderUsageBar(data.data_counter * data.monthly_data_multiplier, data.plan_monthly_data * data.monthly_data_multiplier, "Bandwidth", <Globe className="w-4 h-4" />)}
                      </div>
                       <p className="text-xs text-muted-foreground text-center pt-2">
                          Bandwidth resets on {new Date(data.data_next_reset * 1000).toLocaleDateString()}
                       </p>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={actionState.loading}>
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            disabled={data.ve_status === "Running" || actionState.loading}
                            onClick={() => openConfirmationDialog(cred.id, "start")}
                          >
                            <Play className="mr-2 h-4 w-4" /> Start
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={data.ve_status === "Stopped" || actionState.loading}
                            onClick={() => openConfirmationDialog(cred.id, "stop")}
                          >
                            <StopCircle className="mr-2 h-4 w-4" /> Stop
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            disabled={data.ve_status === "Stopped" || actionState.loading}
                            onClick={() => openConfirmationDialog(cred.id, "restart")}
                          >
                            <RefreshCw className="mr-2 h-4 w-4" /> Restart
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500"
                            onClick={() => handleRemoveCredential(cred.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
            <div className="w-2/3">
              {selectedCredentialId && (
                <MonitoringCharts
                  stats={rawUsageStats[selectedCredentialId]}
                  loading={isChartLoading[selectedCredentialId]}
                />
              )}
            </div>
          </div>
        )}
      </main>

      <AlertDialog open={!!actionToConfirm} onOpenChange={() => setActionToConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will {actionToConfirm?.action} the server. This action can take a few moments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleActionConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}