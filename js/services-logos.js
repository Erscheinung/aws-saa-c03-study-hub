/**
 * Shared AWS service logo mapping used by Logo Quiz (index.html) and Service Catcher game.
 * Logos sourced from gilbarbara/logos on GitHub (SVG).
 * To add a new service: add one entry to AWS_SERVICES below.
 */

const LOGO_BASE = 'https://raw.githubusercontent.com/gilbarbara/logos/main/logos/';

// Map: service key → { name, logo URL, abbreviation (fallback text), category, description }
const AWS_SERVICES = {
    s3:           { name: 'Amazon S3',           logo: `${LOGO_BASE}aws-s3/aws-s3.svg`,                         abbr: 'S3',      category: 'Storage',     desc: 'Object storage for any amount of data' },
    ec2:          { name: 'Amazon EC2',          logo: `${LOGO_BASE}aws-ec2/aws-ec2.svg`,                       abbr: 'EC2',     category: 'Compute',     desc: 'Virtual servers in the cloud' },
    lambda:       { name: 'AWS Lambda',          logo: `${LOGO_BASE}aws-lambda/aws-lambda.svg`,                 abbr: 'Lambda',  category: 'Compute',     desc: 'Run code without provisioning servers' },
    dynamodb:     { name: 'Amazon DynamoDB',     logo: `${LOGO_BASE}aws-dynamodb/aws-dynamodb.svg`,             abbr: 'DDB',     category: 'Database',    desc: 'Managed NoSQL database service' },
    rds:          { name: 'Amazon RDS',          logo: `${LOGO_BASE}aws-rds/aws-rds.svg`,                       abbr: 'RDS',     category: 'Database',    desc: 'Managed relational database' },
    cloudfront:   { name: 'Amazon CloudFront',   logo: `${LOGO_BASE}aws-cloudfront/aws-cloudfront.svg`,         abbr: 'CF',      category: 'Network',     desc: 'Global content delivery network' },
    cloudwatch:   { name: 'Amazon CloudWatch',   logo: `${LOGO_BASE}aws-cloudwatch/aws-cloudwatch.svg`,         abbr: 'CW',      category: 'Management',  desc: 'Monitoring and observability' },
    sqs:          { name: 'Amazon SQS',          logo: `${LOGO_BASE}aws-sqs/aws-sqs.svg`,                       abbr: 'SQS',     category: 'Integration', desc: 'Managed message queue service' },
    sns:          { name: 'Amazon SNS',          logo: `${LOGO_BASE}aws-sns/aws-sns.svg`,                       abbr: 'SNS',     category: 'Integration', desc: 'Pub/sub messaging and notifications' },
    iam:          { name: 'AWS IAM',             logo: `${LOGO_BASE}aws-iam/aws-iam.svg`,                       abbr: 'IAM',     category: 'Security',    desc: 'Identity and access management' },
    vpc:          { name: 'Amazon VPC',          logo: `${LOGO_BASE}aws-vpc/aws-vpc.svg`,                       abbr: 'VPC',     category: 'Network',     desc: 'Isolated virtual network' },
    ecs:          { name: 'Amazon ECS',          logo: `${LOGO_BASE}aws-ecs/aws-ecs.svg`,                       abbr: 'ECS',     category: 'Compute',     desc: 'Container orchestration service' },
    eks:          { name: 'Amazon EKS',          logo: `${LOGO_BASE}aws-eks/aws-eks.svg`,                       abbr: 'EKS',     category: 'Compute',     desc: 'Managed Kubernetes service' },
    glacier:      { name: 'Amazon S3 Glacier',   logo: `${LOGO_BASE}aws-glacier/aws-glacier.svg`,               abbr: 'Glacier', category: 'Storage',     desc: 'Low-cost archive storage' },
    elasticache:  { name: 'Amazon ElastiCache',  logo: `${LOGO_BASE}aws-elasticache/aws-elasticache.svg`,       abbr: 'EC',      category: 'Database',    desc: 'In-memory caching service' },
    route53:      { name: 'Amazon Route 53',     logo: `${LOGO_BASE}aws-route53/aws-route53.svg`,               abbr: 'R53',     category: 'Network',     desc: 'Scalable DNS and domain registration' },
    api_gateway:  { name: 'Amazon API Gateway',  logo: `${LOGO_BASE}aws-api-gateway/aws-api-gateway.svg`,       abbr: 'APIGW',   category: 'Network',     desc: 'Create and manage REST/WebSocket APIs' },
    kinesis:      { name: 'Amazon Kinesis',      logo: `${LOGO_BASE}aws-kinesis/aws-kinesis.svg`,               abbr: 'KIN',     category: 'Analytics',   desc: 'Real-time data streaming' },
    redshift:     { name: 'Amazon Redshift',     logo: `${LOGO_BASE}aws-redshift/aws-redshift.svg`,             abbr: 'RS',      category: 'Analytics',   desc: 'Cloud data warehouse' },
    aurora:       { name: 'Amazon Aurora',        logo: `${LOGO_BASE}aws-rds/aws-rds.svg`,                      abbr: 'Aurora',  category: 'Database',    desc: 'High-performance relational database' },
    efs:          { name: 'Amazon EFS',          logo: `${LOGO_BASE}aws-efs/aws-efs.svg`,                       abbr: 'EFS',     category: 'Storage',     desc: 'Managed NFS file system' },
    ebs:          { name: 'Amazon EBS',          logo: `${LOGO_BASE}aws-ebs/aws-ebs.svg`,                       abbr: 'EBS',     category: 'Storage',     desc: 'Block storage for EC2' },
    codepipeline: { name: 'AWS CodePipeline',    logo: `${LOGO_BASE}aws-codepipeline/aws-codepipeline.svg`,     abbr: 'CP',      category: 'DevOps',      desc: 'Continuous delivery service' },
    stepfunctions:{ name: 'AWS Step Functions',  logo: `${LOGO_BASE}aws-step-functions/aws-step-functions.svg`, abbr: 'SF',      category: 'Integration', desc: 'Visual workflow orchestration' },
    eventbridge:  { name: 'Amazon EventBridge',  logo: `${LOGO_BASE}aws-eventbridge/aws-eventbridge.svg`,       abbr: 'EB',      category: 'Integration', desc: 'Serverless event bus' },
    cognito:      { name: 'Amazon Cognito',      logo: `${LOGO_BASE}aws-cognito/aws-cognito.svg`,               abbr: 'Cog',     category: 'Security',    desc: 'User sign-up, sign-in, and access control' },
    waf:          { name: 'AWS WAF',             logo: `${LOGO_BASE}aws-waf/aws-waf.svg`,                       abbr: 'WAF',     category: 'Security',    desc: 'Web application firewall' },
    kms:          { name: 'AWS KMS',             logo: `${LOGO_BASE}aws-kms/aws-kms.svg`,                       abbr: 'KMS',     category: 'Security',    desc: 'Managed encryption key service' },
    fargate:      { name: 'AWS Fargate',         logo: `${LOGO_BASE}aws-fargate/aws-fargate.svg`,               abbr: 'FG',      category: 'Compute',     desc: 'Serverless compute for containers' },
    athena:       { name: 'Amazon Athena',       logo: `${LOGO_BASE}aws-athena/aws-athena.svg`,                 abbr: 'Ath',     category: 'Analytics',   desc: 'Serverless SQL queries on S3' },
};

/**
 * Creates an <img> element for an AWS service logo with styled text fallback.
 * @param {string} serviceKey - Key from AWS_SERVICES
 * @param {number} size - Pixel size (width & height)
 * @returns {HTMLElement} - The img or fallback span
 */
function createServiceLogo(serviceKey, size = 48) {
    const svc = AWS_SERVICES[serviceKey];
    if (!svc) return document.createElement('span');

    const img = document.createElement('img');
    img.src = svc.logo;
    img.alt = svc.name;
    img.width = size;
    img.height = size;
    img.style.objectFit = 'contain';
    img.draggable = false;

    // Fallback: on error, replace with styled abbreviation text
    img.onerror = function () {
        const span = document.createElement('span');
        span.textContent = svc.abbr;
        span.style.cssText = `display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;background:rgba(255,107,53,0.15);color:#ff6b35;border-radius:8px;font-weight:700;font-size:${Math.max(10, size * 0.3)}px;font-family:'JetBrains Mono',monospace;`;
        img.replaceWith(span);
    };

    return img;
}

/**
 * Get a random subset of service keys.
 * @param {number} count
 * @returns {string[]}
 */
function getRandomServiceKeys(count) {
    const keys = Object.keys(AWS_SERVICES);
    const shuffled = keys.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, keys.length));
}
