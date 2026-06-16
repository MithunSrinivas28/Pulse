import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useState, useEffect } from "react";
const MetricsChart = ({ containerId, containerName }) => {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    if (!containerId) return;

    const fetch = async () => {
      const res = await import("axios").then(m => m.default.get(`http://localhost:3001/api/containers/${containerId}/metrics`));
      setMetrics(res.data.reverse());
    };

    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, [containerId]);

  if (!containerId) return (
    <div style={{ padding: "24px", color: "#9ca3af", fontSize: "14px" }}>
      Click a container card to see its metrics
    </div>
  );

  const data = metrics.map((m) => ({
    time: new Date(m.timestamp).toLocaleTimeString(),
    cpu: m.cpuPercent,
    memory: m.memoryPercent,
  }));

  return (
    <div style={{
      margin: "0 24px 24px",
      background: "#1a1a1a",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "10px",
      padding: "24px"
    }}>
      <div style={{ marginBottom: "20px" }}>
        <span style={{ fontWeight: 600, fontSize: "15px" }}>{containerName}</span>
        <span style={{ color: "#9ca3af", fontSize: "13px", marginLeft: "10px" }}>Last 50 readings</span>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            width={30}
          />
          <Tooltip
            contentStyle={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px" }}
            labelStyle={{ color: "#9ca3af", fontSize: "12px" }}
            itemStyle={{ color: "#fff", fontSize: "12px" }}
          />
          <Line type="monotone" dataKey="cpu" stroke="#ffffff" strokeWidth={1.5} dot={false} name="CPU %" />
          <Line type="monotone" dataKey="memory" stroke="#6b7280" strokeWidth={1.5} dot={false} name="Memory %" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MetricsChart;