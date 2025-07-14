"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";

export interface RawUsageStats {
  data: Datum[];
  vm_type: string;
  error: number;
}

export interface Datum {
  timestamp: number;
  cpu_usage: number;
  network_in_bytes: number;
  network_out_bytes: number;
  disk_read_bytes: number;
  disk_write_bytes: number;
}

interface MonitoringChartsProps {
  stats: RawUsageStats | null;
  loading: boolean;
}

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDate = (timestamp: number) => {
  return new Date(timestamp * 1000).toLocaleTimeString();
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    color: string;
    name: string;
    value: number;
  }>;
  label?: number;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  const { theme } = useTheme();
  if (active && payload && payload.length) {
    const formattedLabel = new Date((label || 0) * 1000).toLocaleString();
    return (
      <div
        className={`p-2 border rounded-md shadow-lg ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <p className="label font-bold">{`${formattedLabel}`}</p>
        {payload.map((pld, index: number) => (
          <div key={index} style={{ color: pld.color }}>
            {`${pld.name}: ${
              pld.name?.includes("cpu")
                ? `${pld.value?.toFixed(2)}%`
                : formatBytes(pld.value as number)
            }`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const timeRanges = [
  { label: "6 Hours", value: 6 },
  { label: "24 Hours", value: 24 },
  { label: "48 Hours", value: 48 },
  { label: "7 Days", value: 168 },
];

export function MonitoringCharts({ stats, loading }: MonitoringChartsProps) {
  const { theme } = useTheme();
  const strokeColor = theme === "dark" ? "#a0a0a0" : "#666";
  const [timeRange, setTimeRange] = useState(24);

  useEffect(() => {
    const savedTimeRange = localStorage.getItem("chartTimeRange");
    if (savedTimeRange) {
      setTimeRange(JSON.parse(savedTimeRange));
    }
  }, []);

  const handleTimeRangeChange = (value: number) => {
    setTimeRange(value);
    localStorage.setItem("chartTimeRange", JSON.stringify(value));
  };

  if (loading) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <p>Loading charts...</p>
      </div>
    );
  }

  if (!stats || stats.error !== 0 || stats.data.length === 0) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <p className="text-muted-foreground">
          No usage data available to display.
        </p>
      </div>
    );
  }

  const timeAgo = Math.floor(Date.now() / 1000) - timeRange * 60 * 60;
  const chartData = stats.data.filter(d => d.timestamp > timeAgo);

  if (chartData.length === 0) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <p className="text-muted-foreground">
          No usage data available for the last {timeRange === 168 ? '7 days' : `${timeRange} hours`}.
        </p>
      </div>
    );
  }

  const renderChart = (
    title: string,
    dataKey: string | [string, string],
    colors: string | [string, string],
    names: string | [string, string],
    isFirstChart = false,
  ) => (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          {isFirstChart && (
            <div className="flex justify-end gap-2">
              {timeRanges.map(range => (
                <Button
                  key={range.value}
                  variant={timeRange === range.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeRangeChange(range.value)}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatDate}
              stroke={strokeColor}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(val) =>
                title.includes("CPU") ? `${val}%` : formatBytes(val)
              }
              stroke={strokeColor}
              fontSize={12}
              domain={title.includes("CPU") ? [0, 100] : undefined}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {Array.isArray(dataKey) ? (
              <>
                <Line
                  type="monotone"
                  dataKey={dataKey[0]}
                  name={names[0]}
                  stroke={colors[0]}
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey={dataKey[1]}
                  name={names[1]}
                  stroke={colors[1]}
                  dot={false}
                  strokeWidth={2}
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
                name={names as string}
                stroke={colors as string}
                dot={false}
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      {renderChart("CPU Usage", "cpu_usage", "#8884d8", "CPU Usage", true)}
      {renderChart(
        "Network I/O",
        ["network_in_bytes", "network_out_bytes"],
        ["#82ca9d", "#ffc658"],
        ["Network In", "Network Out"],
      )}
      {renderChart(
        "Disk I/O",
        ["disk_read_bytes", "disk_write_bytes"],
        ["#ff7300", "#387908"],
        ["Disk Read", "Disk Write"],
      )}
    </div>
  );
}