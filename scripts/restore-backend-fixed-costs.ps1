[CmdletBinding()]
param(
  [string]$AwsRegion = "us-east-1",
  [string]$Cluster = "twf-cluster",
  [string]$Service = "twf-server-service",
  [int]$DesiredCount = 1,
  [string]$LoadBalancerName = "twf-server-alb",
  [string[]]$Subnets = @("subnet-097f71414bcac47e8", "subnet-09a0e206220699f02"),
  [string]$LoadBalancerSecurityGroup = "sg-000f81f8d45c71c85",
  [string]$TargetGroupArn = "arn:aws:elasticloadbalancing:us-east-1:010928227897:targetgroup/twf-server-tg/fdfceaafa1579a36",
  [string]$HostedZoneId = "Z03823382XUVPC6UBY2YI",
  [string]$CertificateArn = "arn:aws:acm:us-east-1:010928227897:certificate/6cab6a6a-6262-4c6a-9a76-f7024ab856d1",
  [string]$SslPolicy = "ELBSecurityPolicy-TLS13-1-2-Res-PQ-2025-09",
  [string]$HealthUrl = "https://api.tierswithfriends.com/health",
  [switch]$SkipDns,
  [switch]$SkipStart,
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

function Get-LoadBalancer {
  $json = aws elbv2 describe-load-balancers `
    --names $LoadBalancerName `
    --region $AwsRegion `
    --output json 2>$null

  if ($LASTEXITCODE -ne 0) {
    return $null
  }

  $response = $json | ConvertFrom-Json
  return $response.LoadBalancers[0]
}

function Write-JsonTempFile {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)]$Value
  )

  $path = Join-Path $env:TEMP $Name
  $json = $Value | ConvertTo-Json -Depth 100
  [System.IO.File]::WriteAllText(
    $path,
    $json,
    [System.Text.UTF8Encoding]::new($false)
  )
  return $path
}

Assert-Command "aws"

$loadBalancer = Get-LoadBalancer
if (-not $loadBalancer) {
  Write-Host "Creating Application Load Balancer '$LoadBalancerName'..."
  aws elbv2 create-load-balancer `
    --name $LoadBalancerName `
    --subnets $Subnets `
    --security-groups $LoadBalancerSecurityGroup `
    --scheme internet-facing `
    --type application `
    --ip-address-type ipv4 `
    --region $AwsRegion `
    --output json | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "aws elbv2 create-load-balancer failed."
  }

  Write-Host "Waiting for Application Load Balancer to become available..."
  aws elbv2 wait load-balancer-available `
    --names $LoadBalancerName `
    --region $AwsRegion
  if ($LASTEXITCODE -ne 0) {
    throw "aws elbv2 wait load-balancer-available failed."
  }

  $loadBalancer = Get-LoadBalancer
}

if (-not $loadBalancer) {
  throw "Unable to read Application Load Balancer '$LoadBalancerName'."
}

$loadBalancerArn = $loadBalancer.LoadBalancerArn
$listenersJson = aws elbv2 describe-listeners `
  --load-balancer-arn $loadBalancerArn `
  --region $AwsRegion `
  --output json 2>$null
if ($LASTEXITCODE -ne 0) {
  throw "aws elbv2 describe-listeners failed."
}

$listeners = ($listenersJson | ConvertFrom-Json).Listeners
$hasHttpListener = $listeners | Where-Object { $_.Port -eq 80 } | Select-Object -First 1
$hasHttpsListener = $listeners | Where-Object { $_.Port -eq 443 } | Select-Object -First 1

if (-not $hasHttpListener) {
  $httpActionsPath = Write-JsonTempFile -Name "twf-alb-http-actions.json" -Value @(
    @{
      Type = "redirect"
      RedirectConfig = @{
        Protocol = "HTTPS"
        Port = "443"
        Host = "#{host}"
        Path = "/#{path}"
        Query = "#{query}"
        StatusCode = "HTTP_301"
      }
    }
  )

  Write-Host "Creating HTTP redirect listener..."
  aws elbv2 create-listener `
    --load-balancer-arn $loadBalancerArn `
    --protocol HTTP `
    --port 80 `
    --default-actions "file://$httpActionsPath" `
    --region $AwsRegion `
    --output table
  if ($LASTEXITCODE -ne 0) {
    throw "aws elbv2 create-listener for HTTP failed."
  }
}

if (-not $hasHttpsListener) {
  $httpsActionsPath = Write-JsonTempFile -Name "twf-alb-https-actions.json" -Value @(
    @{
      Type = "forward"
      TargetGroupArn = $TargetGroupArn
    }
  )

  Write-Host "Creating HTTPS listener..."
  aws elbv2 create-listener `
    --load-balancer-arn $loadBalancerArn `
    --protocol HTTPS `
    --port 443 `
    --certificates CertificateArn=$CertificateArn `
    --ssl-policy $SslPolicy `
    --default-actions "file://$httpsActionsPath" `
    --region $AwsRegion `
    --output table
  if ($LASTEXITCODE -ne 0) {
    throw "aws elbv2 create-listener for HTTPS failed."
  }
}

if (-not $SkipDns) {
  $dnsName = "dualstack.$($loadBalancer.DNSName)."
  $route53ChangePath = Write-JsonTempFile -Name "twf-api-route53-upsert.json" -Value @{
    Comment = "Restore api.tierswithfriends.com alias after backend fixed-cost park"
    Changes = @(
      @{
        Action = "UPSERT"
        ResourceRecordSet = @{
          Name = "api.tierswithfriends.com."
          Type = "A"
          AliasTarget = @{
            HostedZoneId = $loadBalancer.CanonicalHostedZoneId
            DNSName = $dnsName
            EvaluateTargetHealth = $true
          }
        }
      }
    )
  }

  Write-Host "Updating Route 53 api.tierswithfriends.com alias..."
  aws route53 change-resource-record-sets `
    --hosted-zone-id $HostedZoneId `
    --change-batch "file://$route53ChangePath" `
    --output table
  if ($LASTEXITCODE -ne 0) {
    throw "aws route53 change-resource-record-sets failed."
  }
}

if (-not $SkipStart) {
  if ($DesiredCount -lt 1) {
    throw "DesiredCount must be at least 1 when starting the backend."
  }

  Write-Host "Starting ECS service '$Service' with desired count $DesiredCount..."
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
    $healthResponse = Invoke-WebRequest -UseBasicParsing -Uri $HealthUrl -TimeoutSec 30
    Write-Host "Health check status code: $($healthResponse.StatusCode)"
  }
}

Write-Host ""
Write-Host "Backend fixed-cost infrastructure is restored."
