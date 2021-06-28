# Docker Swarm Visualizer

![screenshot](https://raw.githubusercontent.com/yandeu/visualizer-swarm-visualizer/main/readme/screenshot.webp)

## Features

- Real-Time Monitoring
- Vertical Service **Autoscaler** (in development)
- Automated Image Updates (soon)

## Docker Hub

Check out the image on [`hub.docker.com`](https://hub.docker.com/r/yandeu/visualizer).

## Info

Minimum Docker API = 1.41 (Run `docker version` to check your API version)

## Getting Started

1. Make sure you are using docker in swarm mode `docker swarm init`

2. Make sure you can access your swarm on port **9500/tcp**.

3. Make sure the nodes can communicate with each other on port **9501/tcp**.

4. Deploy the Visualizer  
   [`docker stack deploy -c docker-compose.yml visualizer`](https://github.com/yandeu/docker-swarm-visualizer/main/docker-compose.yml)

5. Open the Visualizer Dashboard  
   `http://127.0.0.1:9500` or `http://[NODE_IP]:9500`

## Autoscaler

_In Beta_  
Set `environment` variable `TASKS` to `true` in both services (manager and agent).  
See the [`nginx.tasks.yml`](https://github.com/yandeu/docker-swarm-visualizer/blob/main/dev/nginx.tasks.yml).
