"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ModeToggle } from "@/components/mode-toggle";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Server } from "lucide-react";
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
import { MonitoringCharts } from "@/components/monitoring-charts";
import { ServerList } from "@/components/server-list";
import { useKiwiVMApi } from "@/hooks/useKiwiVMApi";
import { toast } from "sonner";

export default function Home() {
  const {
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
  } = useKiwiVMApi();

  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<{ id: string; action: "start" | "stop" | "restart" } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30);

  const handleAddCredentialSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const veid = formData.get("veid") as string;
    const api_key = formData.get("api_key") as string;

    if (veid && api_key) {
      addCredential(veid, api_key);
      setAddDialogOpen(false);
    } else {
      toast.warning("Please fill in both fields.");
    }
  };

  const handleActionConfirm = () => {
    if (actionToConfirm) {
      handleAction(actionToConfirm.id, actionToConfirm.action);
      setActionToConfirm(null);
    }
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
              <form onSubmit={handleAddCredentialSubmit}>
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
            <ServerList
              credentials={credentials}
              serverData={serverData}
              fetchStates={fetchStates}
              actionStates={actionStates}
              selectedCredentialId={selectedCredentialId}
              onSelectCredential={setSelectedCredentialId}
              onAction={setActionToConfirm}
              onRemove={removeCredential}
            />
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