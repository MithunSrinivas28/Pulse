const ContainerCard = ({ container, selected, onClick }) => {
  const { name, cpuPercent, memoryPercent, restartCount, isAnomaly } = container;

  return (
    <div className={`card ${selected ? "selected" : ""}`} onClick={onClick}>
      <div className="card-header">
        <span className="card-name">{name}</span>
        {isAnomaly && (
          <span className="anomaly-badge">
            <span className="anomaly-dot" /> Anomaly
          </span>
        )}
      </div>

      <div className="metric-row">
        <span>CPU</span>
        <span>{cpuPercent}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.min(cpuPercent, 100)}%` }} />
      </div>

      <div className="metric-row">
        <span>Memory</span>
        <span>{memoryPercent}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.min(memoryPercent, 100)}%` }} />
      </div>

      <div className="restart-row">
        <span>Restarts</span>
        <span className="restart-badge">{restartCount}</span>
      </div>
    </div>
  );
};

export default ContainerCard;