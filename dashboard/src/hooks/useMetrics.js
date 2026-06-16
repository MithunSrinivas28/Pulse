import { useState, useEffect } from "react";
import axios from "axios";

export const useMetrics = (containerId) => {
  const [metrics, setMetrics] = useState([]);

  useEffect(() => {
    if (!containerId) return;

    const fetch = async () => {
      const res = await axios.get(`http://localhost:3001/api/containers/${containerId}/metrics`);
      // Reverse so oldest is left, newest is right on the chart
      setMetrics(res.data.reverse());
    };

    fetch();
    const interval = setInterval(fetch, 10000);
    return () => clearInterval(interval);
  }, [containerId]);

  return metrics;
};