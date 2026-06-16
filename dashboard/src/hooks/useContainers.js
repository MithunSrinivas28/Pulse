import { useState, useEffect } from "react";
import axios from "axios";

export const useContainers = () => {
  const [containers, setContainers] = useState([]);

  const fetchContainers = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/containers");
      // Ensure we always set an array
      const data = Array.isArray(res.data) ? res.data : [];
      setContainers(data);
    } catch (err) {
      console.error("Failed to fetch containers:", err.message);
    }
  };

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 10000);
    return () => clearInterval(interval);
  }, []);

  return containers;
};