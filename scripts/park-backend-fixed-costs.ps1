[CmdletBinding()]
param(
  [string]$AwsRegion = "us-east-1",
  [string]$Cluster = "twf-cluster",
  [string]$Service = "twf-server-service",
  [string]$LoadBalancerName = "twf-server-alb",
  [string]$TargetGroupName = "twf-server-tg",
  [string]$HostedZoneId = "Z03823382XUVPC6UBY2YI",
  [string]$BackupDir = "scripts/aws-state",
  [switch]$Wait
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Command {
  param([Parameter(Mandatory = $true)][string]$Name)

  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command '$Name' was not found on PATH."
  }
}

function Save-AwsJson {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][scriptblock]$Command
  )

  $json = & $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to save AWS state to '$Path'."
  }

  Set-Content -Path $Path -Value $json -Encoding utf8
}

Assert-Command "aws"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$resolvedBackupRoot = Join-Path $repoRoot $BackupDir
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$snapshotDir = Join-Path $resolvedBackupRoot "backend-park-$timestamp"
New-Item -ItemType Directory -Force -Path $snapshotDir | Out-Null

Write-Host "Saving backend AWS state to $snapshotDir"
Save-AwsJson -Path (Join-Path $snapshotDir "ecs-service.json") -Command {
  aws ecs describe-services `
    --cluster $Cluster `
    --services $Service `
    --region $AwsRegion `
    --output json
}
Save-AwsJson -Path (Join-Path $snapshotDir "target-group.json") -Command {
  aws elbv2 describe-target-groups `
    --names $TargetGroupName `
    --region $AwsRegion `
    --output json
}
Save-AwsJson -Path (Join-Path $snapshotDir "route53-records.json") -Command {
  aws route53 list-resource-record-sets `
    --hosted-zone-id $HostedZoneId `
    --output json
}

Write-Host "Scaling ECS service '$Service' to desired count 0..."
aws ecs update-service `
  --cluster $Cluster `
  --service $Service `
  --desired-count 0 `
  --region $AwsRegion `
  --query "service.{Desired:desiredCount,Running:runningCount,Pending:pendingCount,Status:status}" `
  --output table
if ($LASTEXITCODE -ne 0) {
  throw "aws ecs update-service failed."
}

Write-Host "Waiting for ECS service to become stable at desired count 0..."
aws ecs wait services-stable `
  --cluster $Cluster `
  --services $Service `
  --region $AwsRegion
if ($LASTEXITCODE -ne 0) {
  throw "aws ecs wait services-stable failed."
}

$loadBalancerJson = aws elbv2 describe-load-balancers `
  --names $LoadBalancerName `
  --region $AwsRegion `
  --output json 2>$null

if ($LASTEXITCODE -ne 0) {
  Write-Host "Load balancer '$LoadBalancerName' was not found. Backend fixed-cost park is already applied."
  exit 0
}

Set-Content -Path (Join-Path $snapshotDir "load-balancer.json") -Value $loadBalancerJson -Encoding utf8
$loadBalancerResponse = $loadBalancerJson | ConvertFrom-Json
$loadBalancer = $loadBalancerResponse.LoadBalancers[0]
$loadBalancerArn = $loadBalancer.LoadBalancerArn

Save-AwsJson -Path (Join-Path $snapshotDir "load-balancer-attributes.json") -Command {
  aws elbv2 describe-load-balancer-attributes `
    --load-balancer-arn $loadBalancerArn `
    --region $AwsRegion `
    --output json
}
Save-AwsJson -Path (Join-Path $snapshotDir "listeners.json") -Command {
  aws elbv2 describe-listeners `
    --load-balancer-arn $loadBalancerArn `
    --region $AwsRegion `
    --output json
}

$latestSnapshotPath = Join-Path $resolvedBackupRoot "latest-backend-park-snapshot.txt"
Set-Content -Path $latestSnapshotPath -Value $snapshotDir -Encoding utf8

Write-Host "Deleting Application Load Balancer '$LoadBalancerName'..."
aws elbv2 delete-load-balancer `
  --load-balancer-arn $loadBalancerArn `
  --region $AwsRegion
if ($LASTEXITCODE -ne 0) {
  throw "aws elbv2 delete-load-balancer failed."
}

if ($Wait) {
  Write-Host "Waiting for Application Load Balancer deletion to finish..."
  aws elbv2 wait load-balancers-deleted `
    --load-balancer-arns $loadBalancerArn `
    --region $AwsRegion
  if ($LASTEXITCODE -ne 0) {
    throw "aws elbv2 wait load-balancers-deleted failed."
  }
}

Write-Host ""
Write-Host "Backend is parked for lower fixed AWS cost."
Write-Host "Kept ECS, target group, ECR, CloudWatch log group, Route 53 hosted zone, and ACM certificates for restore."
