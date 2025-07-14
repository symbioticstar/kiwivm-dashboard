"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  Server,
  MoreVertical,
  Play,
  StopCircle,
  RefreshCw,
  Globe,
  HardDrive,
  MemoryStick,
  Trash2,
} from "lucide-react";
import type { ServerData, FetchState, ActionState } from "@/types";

interface ServerCardProps {
  credId: string;
  veid: string;
  data: ServerData | null;
  state: FetchState;
  actionState: ActionState;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (action: "start" | "stop" | "restart") => void;
  onRemove: () => void;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

const renderUsageBar = (
  used: number,
  total: number,
  label: string,
  icon: React.ReactNode,
) => {
  const percentage = total > 0 ? (used / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between items-center mb-1 text-sm">
        <span className="font-medium flex items-center">
          {icon}
          <span className="ml-2">{label}</span>
        </span>
        <span className="text-muted-foreground">{`${formatBytes(
          used,
        )} / ${formatBytes(total)}`}</span>
      </div>
      <Progress value={percentage} />
    </div>
  );
};

export function ServerCard({
  veid,
  data,
  state,
  actionState,
  isSelected,
  onSelect,
  onAction,
  onRemove,
}: ServerCardProps) {
  if (state.loading && !state.refreshing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Fetching data for VEID: {veid}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center p-10">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (state.error && !data) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>Could not fetch data for VEID: {veid}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive-foreground bg-destructive/20 p-3 rounded-md">
            {state.error}
          </p>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="destructive" size="sm" onClick={onRemove}>
            <Trash2 className="mr-2 h-4 w-4" /> Remove
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!data) return null;

  const statusColor =
    data.suspended ? "bg-red-500"
      : data.ve_status === "Running" ? "bg-green-500"
        : "bg-gray-500";

  return (
    <Card
      onClick={onSelect}
      className={`cursor-pointer ${isSelected ? "border-primary" : ""}`}
    >
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
            {state.refreshing && (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            )}
            {actionState.loading && <Loader2 className="h-5 w-5 animate-spin" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            <span>{data.os}</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>{data.node_location}</span>
          </div>
        </div>
        <div className="space-y-3">
          {renderUsageBar(
            data.plan_ram - data.mem_available_kb * 1024,
            data.plan_ram,
            "RAM",
            <MemoryStick className="w-4 h-4" />,
          )}
          {renderUsageBar(
            data.ve_used_disk_space_b,
            data.plan_disk,
            "Disk",
            <HardDrive className="w-4 h-4" />,
          )}
          {renderUsageBar(
            data.data_counter * data.monthly_data_multiplier,
            data.plan_monthly_data * data.monthly_data_multiplier,
            "Bandwidth",
            <Globe className="w-4 h-4" />,
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center pt-2">
          Bandwidth resets on{" "}
          {new Date(data.data_next_reset * 1000).toLocaleDateString()}
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
              onClick={() => onAction("start")}
            >
              <Play className="mr-2 h-4 w-4" /> Start
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={data.ve_status === "Stopped" || actionState.loading}
              onClick={() => onAction("stop")}
            >
              <StopCircle className="mr-2 h-4 w-4" /> Stop
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={data.ve_status === "Stopped" || actionState.loading}
              onClick={() => onAction("restart")}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Restart
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-500"
              onClick={onRemove}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}
