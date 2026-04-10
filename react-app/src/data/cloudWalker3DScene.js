// ─────────────────────────────────────────────────────────────────────────────
// Cloud Walker 3D — scene definition.
//
// Single source of truth for the memory-palace world. Each entry maps an AWS
// service to a literal physical environment element with a position in the
// world (x, z; y is computed by the builder), some basic geometry hints, and
// the sidebar facts shown when the user clicks/interacts with it.
//
// Add a new service: append one entry. The scene builder reads this list to
// instance the geometry; the sidebar reads `facts` for the click info panel.
// ─────────────────────────────────────────────────────────────────────────────

// World is a flat 200x200 plane centered at origin. Y is up. Coordinates are
// in meters. Spawn point is (0, 1.7, 0) — eye height of an average human.
export const WORLD_SIZE = 200
export const SPAWN = { x: 0, y: 1.7, z: 0 }

// Each environment kind has a custom builder in CloudWalker3D.jsx → buildScene().
// Use the `kind` field to dispatch.
export const SCENE_OBJECTS = [
  {
    id: 's3',
    name: 'S3 — Object Storage',
    kind: 'warehouse',
    position: { x: -25, z: -25 },
    color: 0xf97316, // orange
    facts: [
      'S3 is object storage with 11 nines (99.999999999%) of durability.',
      'Storage classes: Standard, IA, One Zone-IA, Glacier Instant, Glacier Flexible, Glacier Deep Archive.',
      'Lifecycle rules can auto-transition objects between classes by age.',
      'Versioning + MFA Delete = ransomware protection.',
      'Server-side encryption: SSE-S3, SSE-KMS, SSE-C.',
    ],
  },
  {
    id: 'glacier',
    name: 'S3 Glacier — Cold Storage',
    kind: 'iceCave',
    position: { x: -55, z: 10 },
    color: 0x60a5fa, // ice blue
    facts: [
      'Glacier Deep Archive is the cheapest AWS storage tier.',
      'Retrieval times: Expedited (1-5 min), Standard (3-5 hr), Bulk (5-12 hr).',
      'Vault Lock policies enforce WORM (write-once-read-many) compliance.',
      'Best for: long-term archival, compliance backups, regulated industries.',
    ],
  },
  {
    id: 'ec2',
    name: 'EC2 — Server Rack Room',
    kind: 'serverRack',
    position: { x: 25, z: -25 },
    color: 0x22c55e,
    facts: [
      'Instance families: General (T/M), Compute (C), Memory (R/X), Storage (I/D), Accelerated (P/G).',
      'Pricing: On-Demand, Reserved (1y/3y), Spot (up to 90% off), Savings Plans.',
      'Placement Groups: Cluster (low latency), Spread (HW isolation), Partition (big data).',
      'EBS-optimized instances reserve dedicated bandwidth for storage I/O.',
    ],
  },
  {
    id: 'lambda',
    name: 'Lambda — Floating Functions',
    kind: 'floatingNodes',
    position: { x: 0, z: -45 },
    color: 0xfacc15, // yellow
    facts: [
      'Serverless compute — runs code without provisioning servers.',
      'Max execution time: 15 minutes per invocation.',
      'Memory: 128 MB to 10 GB (CPU scales linearly with memory).',
      'Triggered by 200+ event sources (S3, API Gateway, SQS, EventBridge, ...).',
      'Cold starts can be mitigated with provisioned concurrency.',
    ],
  },
  {
    id: 'rds',
    name: 'RDS — Underground Database Vault',
    kind: 'undergroundVault',
    position: { x: 25, z: 25 },
    color: 0x8b5cf6,
    facts: [
      'Managed relational database for MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, Aurora.',
      'Multi-AZ = synchronous standby in another AZ for HA failover.',
      'Read Replicas = asynchronous, scale read traffic, can be cross-region.',
      'Automated backups + manual snapshots stored in S3.',
    ],
  },
  {
    id: 'aurora',
    name: 'Aurora — Sky Borealis',
    kind: 'auroraSky',
    position: { x: 0, z: 0 }, // ceiling — position is decorative
    color: 0xa78bfa,
    facts: [
      'AWS-built MySQL/PostgreSQL-compatible engine; up to 5x faster than MySQL.',
      'Storage auto-scales up to 128 TB; 6 copies across 3 AZs automatically.',
      'Aurora Serverless v2 scales compute in fine-grained increments.',
      'Global Database: cross-region replication < 1 sec lag.',
    ],
  },
  {
    id: 'cloudfront',
    name: 'CloudFront — Edge Beams',
    kind: 'edgeBeams',
    position: { x: -25, z: 25 },
    color: 0x06b6d4, // cyan
    facts: [
      'Global CDN with 600+ edge locations.',
      'Origins: S3, ALB, EC2, custom HTTP, MediaStore.',
      'Signed URLs / signed cookies for paid content.',
      'Origin Access Control (OAC) restricts S3 access to CloudFront only.',
    ],
  },
  {
    id: 'vpc',
    name: 'VPC — Walled City',
    kind: 'walledCity',
    position: { x: 55, z: 0 },
    color: 0xe879f9, // pink-purple
    facts: [
      'Isolated virtual network where you launch AWS resources.',
      'Subnets are AZ-scoped. Public subnets route via Internet Gateway.',
      'NAT Gateway lets private subnets reach the internet outbound.',
      'Security Groups (stateful) vs NACLs (stateless).',
    ],
  },
  {
    id: 'iam',
    name: 'IAM — Guarded Gate',
    kind: 'guardedGate',
    position: { x: 0, z: 45 },
    color: 0xef4444, // red
    facts: [
      'Users, Groups, Roles, Policies. Always least privilege.',
      'Roles are assumed by AWS services or federated users — no long-lived keys.',
      'Policy evaluation: explicit Deny > explicit Allow > implicit Deny.',
      'IAM Access Analyzer flags resources shared outside your account.',
    ],
  },
  {
    id: 'route53',
    name: 'Route 53 — Signpost Junction',
    kind: 'signpost',
    position: { x: -55, z: -25 },
    color: 0xfb923c,
    facts: [
      'Authoritative DNS + domain registration + health checks.',
      'Routing policies: Simple, Weighted, Latency, Failover, Geolocation, Geoproximity, Multi-value.',
      'Alias records resolve to AWS resources (ALB, CloudFront, S3 web) at no cost.',
      'Health checks integrate with failover routing for HA.',
    ],
  },
]
