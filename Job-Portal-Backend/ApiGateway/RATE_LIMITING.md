# Rate Limiting Implementation - Job Portal System

## Overview
This document describes the rate limiting implementation in the API Gateway using Redis.

## Features

### What is Implemented:
✅ **Token Bucket Algorithm** - Tracks requests and resets counters per time window
✅ **Redis Storage** - Persistent, fast request counters
✅ **Three-Level Limiting**:
   - By User ID (for authenticated users)
   - By IP Address (for all requests)
   - By API Key (if provided)

✅ **Configurable Limits** - Easily adjust via application.properties
✅ **Fail-Safe Design** - Allows requests if Redis is unavailable
✅ **Rate Limit Headers** - Standard HTTP headers in responses
✅ **Admin API** - Reset limits per user/IP/API key

---

## Configuration

### application.properties

```properties
# Enable/disable rate limiting
ratelimit.enabled=true

# Maximum requests per time window
ratelimit.max-requests=100

# Time window in seconds
ratelimit.time-window-seconds=60

# Enable rate limiting per user ID (for authenticated requests)
ratelimit.enable-user-limit=true

# Enable rate limiting per IP address
ratelimit.enable-ip-limit=true

# Enable rate limiting per API key
ratelimit.enable-apikey-limit=true

# Redis Configuration
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=
spring.data.redis.timeout=2000
spring.data.redis.jedis.pool.max-active=8
spring.data.redis.jedis.pool.max-idle=8
```

---

## How It Works

### Request Flow:

1. **Request arrives at API Gateway**
   ```
   GET /api/jobs/1
   Headers:
     - X-User-Id: 123
     - X-API-Key: sk_test_1234...
   ```

2. **Rate Limiting Filter checks limits in order:**
   - First: Check **User ID** limit (if available and enabled)
   - Second: Check **API Key** limit (if available and enabled)
   - Third: Check **IP Address** limit (always checked as fallback)

3. **Redis Counter Logic:**
   ```
   Key: "ratelimit:user:123"
   Value: Current request count
   TTL: 60 seconds
   
   If count <= max_requests (100) → ALLOW
   If count > max_requests → DENY (429 Too Many Requests)
   ```

4. **Response Headers Added:**
   ```
   X-RateLimit-Limit: 100
   X-RateLimit-Remaining: 42
   X-RateLimit-Reset: 1711800675000 (unix timestamp)
   ```

---

## Rate Limit Keys in Redis

### User-Based Limiting
**Key Format:** `ratelimit:user:{userId}`
**Example:** `ratelimit:user:123`
**Use Case:** Authenticate user limits their own requests

```bash
# View user rate limit counter
redis-cli GET ratelimit:user:123

# Reset user rate limit
redis-cli DEL ratelimit:user:123
```

### IP-Based Limiting
**Key Format:** `ratelimit:ip:{ipAddress}`
**Example:** `ratelimit:ip:192.168.1.100`
**Use Case:** Prevent abuse from specific IP addresses

```bash
# View IP rate limit counter
redis-cli GET ratelimit:ip:192.168.1.100

# Reset IP rate limit
redis-cli DEL ratelimit:ip:192.168.1.100
```

### API Key-Based Limiting
**Key Format:** `ratelimit:apikey:{apiKey}`
**Example:** `ratelimit:apikey:sk_test_1234567890`
**Use Case:** Limit requests per API key for integrations

```bash
# View API key rate limit counter
redis-cli GET ratelimit:apikey:sk_test_1234567890

# Reset API key rate limit
redis-cli DEL ratelimit:apikey:sk_test_1234567890
```

---

## API Examples

### Example 1: Authenticated User Request
```bash
curl -X GET http://localhost:8085/api/jobs/1 \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "X-User-Id: 123"

# Response Headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 98
# X-RateLimit-Reset: 1711800675000
```

### Example 2: API Key Request
```bash
curl -X POST http://localhost:8085/api/jobs \
  -H "X-API-Key: sk_test_1234567890" \
  -H "Content-Type: application/json" \
  -d '{"title": "Senior Developer"}'

# Response Headers:
# X-RateLimit-Limit: 100
# X-RateLimit-Remaining: 99
# X-RateLimit-Reset: 1711800675000
```

### Example 3: Rate Limit Exceeded
```bash
# After 100 requests in 60 seconds...

curl -X GET http://localhost:8085/api/jobs/1 \
  -H "Authorization: Bearer eyJhbGc..."

# Response (429 Too Many Requests):
# {
#   "status": 429,
#   "message": "User rate limit exceeded. Max 100 requests per 60 seconds",
#   "errorCode": "RATE_LIMIT_EXCEEDED"
# }
```

---

## Admin API Endpoints

### Reset User Rate Limit
```bash
DELETE /api/gateway/ratelimit/user/{userId}

# Example:
curl -X DELETE http://localhost:8085/api/gateway/ratelimit/user/123

# Response:
{
  "message": "Rate limit reset for user: 123",
  "status": "success"
}
```

### Reset IP Rate Limit
```bash
DELETE /api/gateway/ratelimit/ip/{ipAddress}

# Example:
curl -X DELETE http://localhost:8085/api/gateway/ratelimit/ip/192.168.1.100

# Response:
{
  "message": "Rate limit reset for IP: 192.168.1.100",
  "status": "success"
}
```

### Reset API Key Rate Limit
```bash
DELETE /api/gateway/ratelimit/apikey/{apiKey}

# Example:
curl -X DELETE http://localhost:8085/api/gateway/ratelimit/apikey/sk_test_1234567890

# Response:
{
  "message": "Rate limit reset for API Key: sk_test_1234567890",
  "status": "success"
}
```

### Health Check
```bash
GET /api/gateway/ratelimit/health

# Response:
{
  "status": "up",
  "message": "Rate limiting service is running"
}
```

---

## Default Limits

| Category | Max Requests | Time Window |
|----------|-------------|-------------|
| Per User ID | 100 | 60 seconds |
| Per IP Address | 100 | 60 seconds |
| Per API Key | 100 | 60 seconds |

### Adjusting Limits

Update `application.properties`:
```properties
# Standard tier: 100 requests per 60 seconds
ratelimit.max-requests=100
ratelimit.time-window-seconds=60

# Premium tier: 1000 requests per 60 seconds
ratelimit.max-requests=1000
ratelimit.time-window-seconds=60

# Strict tier: 10 requests per 60 seconds
ratelimit.max-requests=10
ratelimit.time-window-seconds=60
```

---

## Error Responses

### Rate Limit Exceeded (529)
```json
{
  "status": 429,
  "message": "User rate limit exceeded. Max 100 requests per 60 seconds",
  "errorCode": "RATE_LIMIT_EXCEEDED"
}
```

### IP Rate Limit Exceeded
```json
{
  "status": 429,
  "message": "IP rate limit exceeded. Max 100 requests per 60 seconds",
  "errorCode": "RATE_LIMIT_EXCEEDED"
}
```

---

## Monitoring and Debugging

### View All Rate Limit Counters in Redis
```bash
redis-cli KEYS "ratelimit:*"
```

### Get Specific Counter Value
```bash
redis-cli GET ratelimit:user:123
# Output: 45  (45 requests made)
```

### Get TTL (Time to Live) of a Counter
```bash
redis-cli TTL ratelimit:user:123
# Output: 30  (30 seconds remaining)
```

### Monitor Real-Time Redis Activity
```bash
redis-cli MONITOR
# Shows all Redis commands in real-time
```

---

## Architecture Diagram

```
┌─────────────────┐
│  Client Request │
└────────┬────────┘
         │
         ▼
┌──────────────────────────┐
│  API Gateway             │
│  RateLimitingFilter      │
└────────┬─────────────────┘
         │
         ├─► Check User ID Limit (if X-User-Id header)
         │   └─► Redis: ratelimit:user:{userId}
         │
         ├─► Check API Key Limit (if X-API-Key header)
         │   └─► Redis: ratelimit:apikey:{apiKey}
         │
         └─► Check IP Address Limit (fallback)
             └─► Redis: ratelimit:ip:{ipAddress}
             
┌─────────────────────────────────┐
│  Redis Database                 │
│  Stores rate limit counters     │
│  with TTL (Time To Live)        │
└─────────────────────────────────┘
         │
         ▼
   ┌─────────────┐
   │  Decision   │
   └──┬──────┬───┘
      │      │
   ALLOW  DENY (429)
     │       │
     ▼       ▼
 Forward   Error Response
 Request
```

---

## Best Practices

1. **Use User ID for Authenticated Requests**
   - Track usage per user
   - Easier to identify power users

2. **Use API Key for Third-Party Integrations**
   - Separate limits for different API consumers
   - Better visibility and control

3. **Use IP Address as Fallback**
   - Prevents brute force attacks
   - Protects against unauthenticated abuse

4. **Monitor Redis Health**
   - Ensure Redis is always available
   - Set up alerting for high counter values

5. **Adjust Limits Based on Usage**
   - Monitor peak traffic
   - Create tiers for premium users

---

## Troubleshooting

### Issue: Redis Connection Refused
**Solution:**
```bash
# Start Redis
docker run -d -p 6379:6379 redis:latest

# Check Redis is running
redis-cli ping  # Should return: PONG
```

### Issue: All Requests Blocked
**Check:**
- Is rate limiting enabled? (`ratelimit.enabled=true`)
- Has the time window expired? (Check TTL in Redis)
- Admin reset the limit: `DELETE /api/gateway/ratelimit/user/{userId}`

### Issue: Requests Not Being Tracked
**Check:**
- Redis keys: `redis-cli KEYS "ratelimit:*"`
- Connection string in application.properties
- Check logs for errors

---

## Files Created

1. **RedisConfig.java** - Redis connection and template configuration
2. **RateLimitingService.java** - Core rate limiting logic
3. **RateLimitingFilter.java** - Gateway filter for applying rate limits
4. **RateLimitConfig.java** - Configuration POJO
5. **RateLimitStatus.java** - Status response object
6. **RateLimitingAdminController.java** - Admin API endpoints
7. **application.properties** - Configuration with Redis and rate limit settings
