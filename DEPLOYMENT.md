# Backend Deployment

This file documents the current production deployment for the Tiers! With Friends backend and the exact steps to ship updates.

## Current Production Setup

- API URL: `https://api.tierswithfriends.com`
- Health check: `https://api.tierswithfriends.com/health`
- Region: `us-east-1`
- Container registry: Amazon ECR
- ECR repository: `twf-server`
- ECS cluster: `twf-cluster`
- ECS service: `twf-server-service`
- ECS task definition family: `twf-server`
- Current task definition revision: `2`
- Launch type: AWS Fargate
- Desired task count: `1`
- Load balancer: `twf-server-alb`
- ALB DNS: `twf-server-alb-2024694171.us-east-1.elb.amazonaws.com`
- Target group: `twf-server-tg`
- CloudWatch log group: `/ecs/twf-server`

The backend is a single Dockerized Node.js service running on ECS/Fargate behind an Application Load Balancer.

## Important Runtime Constraints

- Production currently runs as a single ECS task.
- Production is not horizontally scaled.
- The service is currently deployed without a managed Redis instance configured.
- Because no `REDIS_URL` is configured in ECS right now, room persistence is disabled in production and active rooms are effectively in-memory for the running task.

This means a deployment restart can interrupt live rooms and clear active room state. Plan deploys accordingly.

## Current Container Environment

The current production task definition uses:

- `PORT=3001`
- `CLIENT_ORIGINS=https://www.tierswithfriends.com`
- `ALLOW_PRIVATE_NETWORK_ORIGINS=false`
- `ENABLE_DEBUG_CONTROLS=false`

If you add `REDIS_URL` later, register a new task definition revision and update the service to use it.

## Build The Backend Image

Run these commands from the `server` repo root:

```powershell
docker build -t twf-server:local .
```

This uses the checked-in `Dockerfile` to build the production image locally.

## Push A New Image To ECR

Run these commands from the `server` repo root:

```powershell
$AWS_REGION = "us-east-1"
$AWS_ACCOUNT_ID = "010928227897"
$ECR_URI = "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/twf-server"

aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

docker tag twf-server:local "${ECR_URI}:latest"

docker push "${ECR_URI}:latest"
```

## Deploy A Code-Only Backend Update

If the image changed but the task configuration did not:

```powershell
aws ecs update-service `
  --cluster twf-cluster `
  --service twf-server-service `
  --force-new-deployment `
  --region us-east-1
```

This forces ECS to start a fresh task using the latest image tag already referenced by the current task definition.

## Deploy A Backend Update That Changes Environment Variables Or Task Settings

If you changed env vars, CPU/memory, ports, log config, or anything else in the task definition:

1. Update `ecs-task-definition.json`
2. Register a new task definition revision
3. Point the ECS service at the new revision

Commands:

```powershell
aws ecs register-task-definition `
  --cli-input-json file://ecs-task-definition.json `
  --region us-east-1

aws ecs update-service `
  --cluster twf-cluster `
  --service twf-server-service `
  --task-definition twf-server `
  --force-new-deployment `
  --region us-east-1
```

If you want to pin a specific revision explicitly, use `--task-definition twf-server:<revision>`.

## Verify A Backend Deployment

Check service state:

```powershell
aws ecs describe-services `
  --cluster twf-cluster `
  --services twf-server-service `
  --region us-east-1 `
  --query "services[0].{TaskDefinition:taskDefinition,Running:runningCount,Pending:pendingCount,Events:events[0:5]}"
```

Check the health endpoint:

```powershell
Invoke-WebRequest -UseBasicParsing -Uri "https://api.tierswithfriends.com/health"
```

View recent logs:

```powershell
$stream = aws logs describe-log-streams `
  --log-group-name /ecs/twf-server `
  --order-by LastEventTime `
  --descending `
  --max-items 1 `
  --region us-east-1 `
  --query "logStreams[0].logStreamName" `
  --output text

aws logs get-log-events `
  --log-group-name /ecs/twf-server `
  --log-stream-name $stream `
  --limit 50 `
  --region us-east-1
```

## Recommended Deploy Order

If both backend and frontend changed:

1. Deploy the backend first
2. Verify `https://api.tierswithfriends.com/health`
3. Deploy the frontend
4. Verify room creation and real-time connectivity from `https://www.tierswithfriends.com`
