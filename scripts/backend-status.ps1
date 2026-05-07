[CmdletBinding()]
param(
  [string]$AwsRegion = "us-east-1",
  [string]$Cluster = "twf-cluster",
  [string]$Service = "twf-server-service"
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

aws ecs describe-services `
  --cluster $Cluster `
  --services $Service `
  --region $AwsRegion `
  --query "services[0].{Status:status,Desired:desiredCount,Running:runningCount,Pending:pendingCount,TaskDefinition:taskDefinition,RecentEvents:events[0:3].message}" `
  --output table
