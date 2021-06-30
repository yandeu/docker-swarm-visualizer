# Docker Swarm Visualizer

<a href="https://raw.githubusercontent.com/yandeu/docker-swarm-visualizer/main/readme/screenshot.png">
   <img width="850" alt="screenshot" src="https://raw.githubusercontent.com/yandeu/docker-swarm-visualizer/main/readme/screenshot.png">
</a>

## Features / Tasks

- 📺 **Real-Time Monitoring**  
  Monitor your Swarm Cluster in Real-Time.

- 🎚️ **Vertical Service Autoscaler** (beta)  
  Automatically scale your services up and down based on CPU usage.

- 📦 **Automated Image Updates** (in development)  
  Automatically pulls the latest images from your Registry.

- 🏷️ **Auto Subnet Labeling** (in development)  
  Detects in which subnet your node is to better spread your containers.

- 🪝 **Webhooks** (in planning)  
  Send useful logs/events to your own servers.

## Links

- [`github.com`](https://github.com/yandeu/docker-swarm-visualizer)
- [`hub.docker.com`](https://hub.docker.com/r/yandeu/visualizer)

## Video

Quick introduction [Video on YouTube](https://youtu.be/IEIJm5h7uQs).

## Info

Minimum Docker API = 1.41 (Run `docker version` to check your API version)

## Getting Started

1. Make sure you are using docker in swarm mode (`docker swarm init`).

2. Make sure you can access your swarm on port **9500/tcp**.

3. Make sure the nodes can communicate with each other on port **9501/tcp**.

4. Deploy the Visualizer

   ```bash
   # Download the Stack File (from GitHub)
   curl -L https://git.io/JcGlt -o visualizer.stack.yml

   # Deploy the Stack
   docker stack deploy -c visualizer.stack.yml visualizer
   ```

5. Open the Visualizer Dashboard  
   [`http://127.0.0.1:9500`](http://127.0.0.1:9500) or [`http://[NODE_IP]:9500`](http://[NODE_IP]:9500)

## Tasks

All tasks are either in Beta or in Development.

### Autoscaler (beta)

Set `environment` variable `TASKS` to `true` in both services (manager and agent).

Then, check out the [`nginx.tasks.yml`](https://github.com/yandeu/docker-swarm-visualizer/blob/main/dev/nginx.tasks.yml) example, to configure autoscaling.

### Image Updates (dev)

_Nothing here yet._

### Subnet Labeling (dev)

_Nothing here yet._

### Webhooks (planning)

_Nothing here yet._
