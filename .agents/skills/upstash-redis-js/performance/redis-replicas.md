# Global Redis Replicas

## Overview

Upstash Redis uses global replication with one primary and multiple replicas worldwide. Writes go to primary, reads can use nearest replica. Read-your-writes ensures consistency.

If you want to optimize read latency, you can add more read regions to your Upstash Redis database via the Upstash Console.

## Good For

- Low-latency reads from nearby regions
- Global applications with distributed users
- Read-heavy workloads
- High availability
