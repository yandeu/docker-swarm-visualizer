When Scaling Up, check `docker service ps SERVICE` for:

- `CURRENT STATE` = Pending
- `ERROR` = "no suitable node (insufficien…" `/no suitable node/gm`

If this error appears, scale down again and notify the user (Webhook, Dashboard, Mail) with message `{ currentNodes: x, desiredNodes: x+1 }`

Much easier is just to not use `deploy.resources.reservations[cpus/memory]` and let a auto-scaling group (AWS) handle the up and down scaling of additional worker nodes.
