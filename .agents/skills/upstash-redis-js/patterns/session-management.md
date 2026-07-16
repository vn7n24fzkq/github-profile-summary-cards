# Session Management

## Overview

Store user sessions in Redis with automatic serialization and TTL-based expiration. Sessions contain user state, authentication data, and preferences.

## Good For

- User authentication sessions
- Shopping carts
- Temporary user state
- Multi-page form data
- "Remember me" tokens

## Limitations

- Sessions expire after TTL (must be renewed)
- Large session objects consume memory
- Shared sessions require coordination across devices

## Examples

```typescript
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Create session with 1-hour expiration
async function createSession(userId: string, userData: any) {
  const sessionId = crypto.randomUUID();

  await redis.set(
    `session:${sessionId}`,
    {
      userId,
      ...userData,
      createdAt: Date.now(),
    },
    { ex: 3600 } // 1 hour TTL
  );

  return sessionId;
}

// Get session
async function getSession(sessionId: string) {
  const session = await redis.get<any>(`session:${sessionId}`);
  return session;
}

// Update session and refresh TTL
async function updateSession(sessionId: string, updates: any) {
  const current = await redis.get<any>(`session:${sessionId}`);

  if (!current) {
    throw new Error("Session not found");
  }

  await redis.set(
    `session:${sessionId}`,
    { ...current, ...updates, updatedAt: Date.now() },
    { ex: 3600 } // Reset TTL
  );
}

// Extend session (refresh TTL without updating data)
async function extendSession(sessionId: string) {
  await redis.expire(`session:${sessionId}`, 3600);
}

// Delete session (logout)
async function deleteSession(sessionId: string) {
  await redis.del(`session:${sessionId}`);
}

// User login flow
async function login(email: string, password: string) {
  // Verify credentials (not shown)
  const user = await verifyCredentials(email, password);

  if (!user) {
    throw new Error("Invalid credentials");
  }

  // Create session
  const sessionId = await createSession(user.id, {
    email: user.email,
    name: user.name,
    role: user.role,
  });

  return sessionId;
}

// User logout
async function logout(sessionId: string) {
  await deleteSession(sessionId);
}

// Session with sliding expiration (extends on each access)
async function getSessionWithSliding(sessionId: string) {
  const session = await redis.get<any>(`session:${sessionId}`);

  if (session) {
    // Extend session on access
    await redis.expire(`session:${sessionId}`, 3600);
  }

  return session;
}

// Shopping cart session
async function addToCartSession(sessionId: string, item: any) {
  const key = `cart:${sessionId}`;

  const cart = (await redis.get<any[]>(key)) || [];
  cart.push(item);

  await redis.set(key, cart, { ex: 86400 }); // 24 hour cart

  return cart;
}

// Multi-device sessions (track all user sessions)
async function createMultiDeviceSession(userId: string, deviceInfo: any) {
  const sessionId = crypto.randomUUID();

  // Store session
  await redis.set(
    `session:${sessionId}`,
    { userId, ...deviceInfo, createdAt: Date.now() },
    { ex: 3600 }
  );

  // Track in user's session list
  await redis.sadd(`user:${userId}:sessions`, sessionId);

  return sessionId;
}

// Logout from all devices
async function logoutAllDevices(userId: string) {
  const sessions = await redis.smembers(`user:${userId}:sessions`);

  // Delete all sessions
  const pipeline = redis.pipeline();
  sessions.forEach((sessionId) => {
    pipeline.del(`session:${sessionId}`);
  });
  pipeline.del(`user:${userId}:sessions`);

  await pipeline.exec();
}

// "Remember me" token (long-lived)
async function createRememberMeToken(userId: string) {
  const token = crypto.randomUUID();

  await redis.set(
    `remember:${token}`,
    { userId, createdAt: Date.now() },
    { ex: 2592000 } // 30 days
  );

  return token;
}

async function loginWithRememberMe(token: string) {
  const data = await redis.get<any>(`remember:${token}`);

  if (!data) {
    return null;
  }

  // Create new session
  const sessionId = await createSession(data.userId, {});

  return sessionId;
}

// Session with user activity tracking
async function trackActivity(sessionId: string, action: string) {
  const session = await redis.get<any>(`session:${sessionId}`);

  if (!session) return;

  session.lastActivity = {
    action,
    timestamp: Date.now(),
  };

  await redis.set(`session:${sessionId}`, session, { ex: 3600 });
}

// Clean up expired sessions manually (if needed)
async function cleanupExpiredSessions(userId: string) {
  const sessions = await redis.smembers(`user:${userId}:sessions`);

  const pipeline = redis.pipeline();
  sessions.forEach((sessionId) => {
    pipeline.exists(`session:${sessionId}`);
  });

  const results = await pipeline.exec();

  // Remove invalid sessions from set
  const invalid = sessions.filter((_, i) => results[i] === 0);
  if (invalid.length > 0) {
    await redis.srem(`user:${userId}:sessions`, ...invalid);
  }
}

// Helper placeholder
async function verifyCredentials(email: string, password: string) {
  return { id: "123", email, name: "User", role: "user" };
}
```
