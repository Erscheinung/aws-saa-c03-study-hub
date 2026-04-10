// ─────────────────────────────────────────────────────────────────────────────
// Shared AWS service → logo URL map.
//
// Source: gilbarbara/logos (MIT-licensed community AWS icon set served via
// the GitHub raw CDN). Each entry is the AWS service id (matches the ids in
// services.json) → SVG URL.
//
// Adding a new service is one line: add { "service-id": "url" } below.
//
// AwsLogo (../components/common/AwsLogo.jsx) renders these with a styled
// abbreviation fallback if the network request fails — so a missing or
// renamed file degrades gracefully instead of breaking the UI.
// ─────────────────────────────────────────────────────────────────────────────

const RAW = 'https://raw.githubusercontent.com/gilbarbara/logos/master/logos'

// Map keyed by service id from services.json. Aliases (e.g. 'route 53')
// are normalized in getLogoUrl() below.
export const SERVICE_LOGOS = {
  // Compute
  ec2: `${RAW}/aws-ec2.svg`,
  lambda: `${RAW}/aws-lambda.svg`,
  ecs: `${RAW}/aws-ecs.svg`,
  eks: `${RAW}/aws-eks.svg`,
  'elastic-beanstalk': `${RAW}/aws-elastic-beanstalk.svg`,
  fargate: `${RAW}/aws-fargate.svg`,
  lightsail: `${RAW}/aws-lightsail.svg`,
  batch: `${RAW}/aws-batch.svg`,

  // Storage
  s3: `${RAW}/aws-s3.svg`,
  ebs: `${RAW}/aws-elastic-block-store.svg`,
  efs: `${RAW}/aws-elastic-file-system.svg`,
  fsx: `${RAW}/aws-fsx.svg`,
  'storage-gateway': `${RAW}/aws-storage-gateway.svg`,
  's3 glacier': `${RAW}/aws-glacier.svg`,
  glacier: `${RAW}/aws-glacier.svg`,
  backup: `${RAW}/aws-backup.svg`,
  'snow family': `${RAW}/aws-snowball.svg`,
  datasync: `${RAW}/aws-datasync.svg`,

  // Database
  rds: `${RAW}/aws-rds.svg`,
  aurora: `${RAW}/aws-aurora.svg`,
  dynamodb: `${RAW}/aws-dynamodb.svg`,
  elasticache: `${RAW}/aws-elasticache.svg`,
  redshift: `${RAW}/aws-redshift.svg`,
  neptune: `${RAW}/aws-neptune.svg`,
  documentdb: `${RAW}/aws-documentdb.svg`,

  // Networking
  vpc: `${RAW}/aws-vpc.svg`,
  cloudfront: `${RAW}/aws-cloudfront.svg`,
  route53: `${RAW}/aws-route-53.svg`,
  'route 53': `${RAW}/aws-route-53.svg`,
  elb: `${RAW}/aws-elastic-load-balancing.svg`,
  'api-gateway': `${RAW}/aws-api-gateway.svg`,
  'api gateway': `${RAW}/aws-api-gateway.svg`,
  'direct-connect': `${RAW}/aws-direct-connect.svg`,
  'direct connect': `${RAW}/aws-direct-connect.svg`,
  'global accelerator': `${RAW}/aws-global-accelerator.svg`,
  'transit gateway': `${RAW}/aws-transit-gateway.svg`,
  privatelink: `${RAW}/aws-privatelink.svg`,

  // Security
  iam: `${RAW}/aws-identity-and-access-management_iam.svg`,
  kms: `${RAW}/aws-kms.svg`,
  waf: `${RAW}/aws-waf.svg`,
  shield: `${RAW}/aws-shield.svg`,
  cognito: `${RAW}/aws-cognito.svg`,
  guardduty: `${RAW}/aws-guardduty.svg`,
  inspector: `${RAW}/aws-inspector.svg`,
  macie: `${RAW}/aws-macie.svg`,
  'secrets manager': `${RAW}/aws-secrets-manager.svg`,
  acm: `${RAW}/aws-certificate-manager.svg`,
  'security hub': `${RAW}/aws-security-hub.svg`,
  cloudhsm: `${RAW}/aws-cloudhsm.svg`,

  // Integration
  sqs: `${RAW}/aws-sqs.svg`,
  sns: `${RAW}/aws-sns.svg`,
  eventbridge: `${RAW}/aws-eventbridge.svg`,
  'step-functions': `${RAW}/aws-step-functions.svg`,
  'step functions': `${RAW}/aws-step-functions.svg`,
  kinesis: `${RAW}/aws-kinesis.svg`,

  // Management
  cloudwatch: `${RAW}/aws-cloudwatch.svg`,
  cloudtrail: `${RAW}/aws-cloudtrail.svg`,
  cloudformation: `${RAW}/aws-cloudformation.svg`,
  'systems-manager': `${RAW}/aws-systems-manager.svg`,
  'systems manager': `${RAW}/aws-systems-manager.svg`,
  config: `${RAW}/aws-config.svg`,
  'aws config': `${RAW}/aws-config.svg`,
}

// Normalize a service identifier (id or name) to the lookup key.
function normalize(key) {
  return String(key || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

// Resolve a logo URL for a service id OR display name.
// Returns null if no logo is mapped — callers should fall back to text.
export function getLogoUrl(idOrName) {
  if (!idOrName) return null
  const key = normalize(idOrName)
  if (SERVICE_LOGOS[key]) return SERVICE_LOGOS[key]
  // Try with hyphens swapped
  const hyph = key.replace(/\s/g, '-')
  if (SERVICE_LOGOS[hyph]) return SERVICE_LOGOS[hyph]
  const dehyph = key.replace(/-/g, ' ')
  if (SERVICE_LOGOS[dehyph]) return SERVICE_LOGOS[dehyph]
  return null
}

// Compact abbreviation for the text fallback (e.g. "API Gateway" → "APG").
export function getAbbreviation(name) {
  if (!name) return '?'
  const cleaned = String(name).replace(/[^a-zA-Z0-9 ]/g, '').trim()
  if (!cleaned) return '?'
  // For short single words, use them directly (EC2, S3, IAM, KMS, RDS).
  if (cleaned.length <= 4 && !cleaned.includes(' ')) return cleaned.toUpperCase()
  // Multi-word: take initials, max 3 letters.
  const parts = cleaned.split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase()
  return parts.map((p) => p[0]).join('').slice(0, 3).toUpperCase()
}
