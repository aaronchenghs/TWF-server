[CmdletBinding()]
param(
  [string]$AwsRegion = "us-east-1",
  [string]$Cluster = "twf-cluster",
  [string]$Service = "twf-server-service",
  [int]$DesiredCount = 1,
  [string]$HealthUrl = "https://api.tierswithfriends.com/health",
  [switch]$SkipHealthCheck
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

if ($DesiredCount -lt 1) {
  throw "DesiredCount must be at least 1 when starting the backend."
}

Write-Host "Starting backend ECS service '$Service' in cluster '$Cluster' with desired count $DesiredCount..."
aws ecs update-service `
  --cluster $Cluster `
  --service $Service `
  --desired-count $DesiredCount `
  --region $AwsRegion `
  --query "service.{Desired:desiredCount,Running:runningCount,Pending:pendingCount,Status:status}" `
  --output table
if ($LASTEXITCODE -ne 0) {
  throw "aws ecs update-service failed."
}

Write-Host "Waiting for ECS service to become stable..."
aws ecs wait services-stable `
  --cluster $Cluster `
  --services $Service `
  --region $AwsRegion
if ($LASTEXITCODE -ne 0) {
  throw "aws ecs wait services-stable failed."
}

if (-not $SkipHealthCheck -and $HealthUrl) {
  Write-Host "Checking health endpoint: $HealthUrl"
  $healthResponse = Invoke-WebRequest -UseBasicParsing -Uri $HealthUrl -TimeoutSec 20
  Write-Host "Health check status code: $($healthResponse.StatusCode)"
}

Write-Host "Backend is started."
