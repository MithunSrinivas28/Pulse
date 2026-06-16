const Docker = require('dockerode');

// Windows Docker Desktop exposes a named pipe instead of a Unix socket
const docker = new Docker({ socketPath: '//./pipe/docker_engine' });

const listRunningContainers = async () => {
  // Each object has Id, Names, Image, State, Status — same as `docker ps`
  const containers = await docker.listContainers();
  return containers;
};

module.exports = { docker, listRunningContainers };