const { docker, listRunningContainers } = require('./docker');
const ContainerMetric = require('../models/ContainerMetric');

const calculateCPUPercent = (stats) => {
  const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
  const numCPUs = stats.cpu_stats.online_cpus || 1;
  return (cpuDelta / systemDelta) * numCPUs * 100;
};

const calculateMemoryPercent = (stats) => {
  const usage = stats.memory_stats.usage || 0;
  const limit = stats.memory_stats.limit || 1;
  return (usage / limit) * 100;
};

const collectStats = async () => {
  const containers = await listRunningContainers();

  for (const containerInfo of containers) {
    const container = docker.getContainer(containerInfo.Id);
    const stats = await container.stats({ stream: false });

    const metric = new ContainerMetric({
      containerId:   containerInfo.Id.slice(0, 12),
      name:          containerInfo.Names[0].replace('/', ''),
      image:         containerInfo.Image,
      cpuPercent:    parseFloat(calculateCPUPercent(stats).toFixed(2)),
      memoryPercent: parseFloat(calculateMemoryPercent(stats).toFixed(2)),
      restartCount:  containerInfo.RestartCount || 0,
      timestamp:     new Date(),
    });

    await metric.save(); // persists to MongoDB
    console.log(`[${metric.name}] CPU: ${metric.cpuPercent}% | MEM: ${metric.memoryPercent}% — saved`);
  }
};

const startPolling = () => {
  console.log('Poller started — collecting stats every 10s...');
  collectStats();
  setInterval(collectStats, 10000);
};

module.exports = { startPolling };