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
import { useTheme } from "next-themes";

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

const CustomTooltip = ({ active, payload, label }: any) => {
  const { theme } = useTheme();
  if (active && payload && payload.length) {
    const formattedLabel = new Date(label * 1000).toLocaleString();
    return (
      <div
        className={`p-2 border rounded-md shadow-lg ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <p className="label font-bold">{`${formattedLabel}`}</p>
        {payload.map((pld: any, index: number) => (
          <div key={index} style={{ color: pld.color }}>
            {`${pld.name}: ${
              pld.name.includes("CPU")
                ? `${pld.value.toFixed(2)}%`
                : formatBytes(pld.value)
            }`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function MonitoringCharts({ stats, loading }: MonitoringChartsProps) {
  const { theme } = useTheme();
  const strokeColor = theme === "dark" ? "#a0a0a0" : "#666";

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

  const chartData = stats.data.map((d) => ({ ...d }));

  const renderChart = (
    title: string,
    dataKey: string | [string, string],
    colors: string | [string, string],
  ) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
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
                  stroke={colors[0]}
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey={dataKey[1]}
                  stroke={colors[1]}
                  dot={false}
                  strokeWidth={2}
                />
              </>
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
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
      {renderChart("CPU Usage", "cpu_usage", "#8884d8")}
      {renderChart(
        "Network I/O",
        ["network_in_bytes", "network_out_bytes"],
        ["#82ca9d", "#ffc658"],
      )}
      {renderChart(
        "Disk I/O",
        ["disk_read_bytes", "disk_write_bytes"],
        ["#ff7300", "#387908"],
      )}
    </div>
  );
}
