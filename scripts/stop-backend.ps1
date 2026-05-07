[CmdletBinding()]
param(
  [string]$AwsRegion = "us-east-1",
  [string]$Cluster = "twf-cluster",
  [string]$Service = "twf-server-service",
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

Assert-Command "aws"

Write-Host "Stopping backend ECS service '$Service' in cluster '$Cluster'..."
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

if ($Wait) {
  Write-Host "Waiting for the ECS service to settle at desired count 0..."
  aws ecs wait services-stable `
    --cluster $Cluster `
    --services $Service `
    --region $AwsRegion
  if ($LASTEXITCODE -ne 0) {
    throw "aws ecs wait services-stable failed."
  }
}

Write-Host ""
Write-Host "Backend desired count is now 0. This stops Fargate task charges."
Write-Host "Note: the Application Load Balancer, Route 53, CloudWatch logs, ECR, S3, and CloudFront resources can still have small ongoing charges."
