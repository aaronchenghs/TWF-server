[CmdletBinding()]
param(
  [string]$AwsRegion = "us-east-1",
  [string]$AwsAccountId = "010928227897",
  [string]$Repository = "twf-server",
  [string]$Cluster = "twf-cluster",
  [string]$Service = "twf-server-service",
  [string]$Tag = "latest",
  [string]$LocalImage = "twf-server:local",
  [string]$HealthUrl = "https://api.tierswithfriends.com/health",
  [int]$MaxDeployAttempts = 2,
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

function Get-LatestEcrDigest {
  param(
    [Parameter(Mandatory = $true)][string]$Region,
    [Parameter(Mandatory = $true)][string]$Repo,
    [Parameter(Mandatory = $true)][string]$ImageTag
  )

  for ($i = 1; $i -le 10; $i++) {
    $digest = aws ecr describe-images `
      --repository-name $Repo `
      --image-ids imageTag=$ImageTag `
      --region $Region `
      --query "imageDetails[0].imageDigest" `
      --output text

    if ($LASTEXITCODE -eq 0 -and $digest -and $digest -ne "None") {
      return $digest.Trim()
    }

    Start-Sleep -Seconds 3
  }

  throw "Unable to read the latest digest for '${Repo}:$ImageTag' from ECR."
}

function Get-RunningServiceDigest {
  param(
    [Parameter(Mandatory = $true)][string]$Region,
    [Parameter(Mandatory = $true)][string]$ClusterName,
    [Parameter(Mandatory = $true)][string]$ServiceName
  )

  $taskArn = aws ecs list-tasks `
    --cluster $ClusterName `
    --service-name $ServiceName `
    --region $Region `
    --query "taskArns[0]" `
    --output text

  if ($LASTEXITCODE -ne 0 -or -not $taskArn -or $taskArn -eq "None") {
    throw "No running task was found for ECS service '$ServiceName' in cluster '$ClusterName'."
  }

  $digest = aws ecs describe-tasks `
    --cluster $ClusterName `
    --tasks $taskArn `
    --region $Region `
    --query "tasks[0].containers[0].imageDigest" `
    --output text

  if ($LASTEXITCODE -ne 0 -or -not $digest -or $digest -eq "None") {
    throw "Unable to read running container digest for task '$taskArn'."
  }

  return $digest.Trim()
}

Assert-Command "docker"
Assert-Command "aws"

$ecrRegistry = "$AwsAccountId.dkr.ecr.$AwsRegion.amazonaws.com"
$imageUri = "$ecrRegistry/${Repository}:$Tag"

Write-Host "Building image: $LocalImage"
docker build -t $LocalImage .
if ($LASTEXITCODE -ne 0) {
  throw "docker build failed."
}

Write-Host "Logging in to ECR: $ecrRegistry"
aws ecr get-login-password --region $AwsRegion | docker login --username AWS --password-stdin $ecrRegistry
if ($LASTEXITCODE -ne 0) {
  throw "ECR login failed."
}

Write-Host "Tagging image: $imageUri"
docker tag $LocalImage $imageUri
if ($LASTEXITCODE -ne 0) {
  throw "docker tag failed."
}

Write-Host "Pushing image: $imageUri"
docker push $imageUri
if ($LASTEXITCODE -ne 0) {
  throw "docker push failed."
}

$latestDigest = Get-LatestEcrDigest -Region $AwsRegion -Repo $Repository -ImageTag $Tag
Write-Host "Latest ECR digest: $latestDigest"

for ($attempt = 1; $attempt -le $MaxDeployAttempts; $attempt++) {
  Write-Host "Starting ECS deployment attempt $attempt of $MaxDeployAttempts"
  aws ecs update-service `
    --cluster $Cluster `
    --service $Service `
    --force-new-deployment `
    --region $AwsRegion | Out-Null
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

  $runningDigest = Get-RunningServiceDigest -Region $AwsRegion -ClusterName $Cluster -ServiceName $Service
  Write-Host "Running ECS digest: $runningDigest"

  if ($runningDigest -eq $latestDigest) {
    Write-Host "Deployment succeeded. Running task digest matches ECR digest."

    if (-not $SkipHealthCheck -and $HealthUrl) {
      Write-Host "Checking health endpoint: $HealthUrl"
      $healthResponse = Invoke-WebRequest -UseBasicParsing -Uri $HealthUrl -TimeoutSec 15
      Write-Host "Health check status code: $($healthResponse.StatusCode)"
    }

    exit 0
  }

  Write-Warning "Digest mismatch after attempt $attempt. Expected $latestDigest but found $runningDigest."
  if ($attempt -lt $MaxDeployAttempts) {
    Start-Sleep -Seconds 8
  }
}

throw "Deployment failed: ECS is not running the pushed image digest."
