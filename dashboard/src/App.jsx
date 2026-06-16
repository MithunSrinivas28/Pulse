import { useState } from "react";
import Navbar from "./components/Navbar";
import ContainerCard from "./components/ContainerCard";
import MetricsChart from "./components/MetricsChart";
import { useContainers } from "./hooks/useContainers";

function App() {
  const containers = useContainers();
  const [selected, setSelected] = useState(null);

  const selectedContainer = containers.find(c => c.containerId === selected);

  return (
    <div>
      <Navbar />
      <div className="cards-grid">
        {containers.map((c) => (
          <ContainerCard
            key={c.containerId}
            container={c}
            selected={selected === c.containerId}
            onClick={() => setSelected(c.containerId)}
          />
        ))}
      </div>
      <MetricsChart
        containerId={selected}
        containerName={selectedContainer?.name}
      />
    </div>
  );
}

export default App;