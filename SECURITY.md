# Security & Optimization Guide

## 🚨 Critical Security Setup

### 1. Deploy Firestore Security Rules

**IMPORTANT**: Deploy the security rules immediately to protect your data.

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not done)
firebase init firestore

# Deploy security rules
firebase deploy --only firestore:rules
```

### 2. Verify Security Rules

After deployment, test in Firebase Console:
1. Go to Firestore Database → Rules tab
2. Verify rules are active
3. Test with the Rules Playground

### 3. User Authentication Integration

**Current Issue**: Your app uses localStorage for guest users but Firestore rules expect `request.auth.uid`.

**Solution**: Update guest user flow to use Firebase Anonymous Authentication:

```typescript
// lib/firebase.ts - Add this
import { getAuth, signInAnonymously } from 'firebase/auth';

export const auth = getAuth(app);

// Call this when guest user logs in
export async function signInAsGuest() {
  const result = await signInAnonymously(auth);
  return result.user.uid;
}
```

## 🔒 Additional Security Measures

### 1. Environment Variables Protection

✅ Already using `NEXT_PUBLIC_*` for client-side Firebase config (correct)
✅ Server-only secrets use regular env vars (correct)

**Recommendation**: Add to `.env.example`:
```
# Never commit .env to git
# Add .env to .gitignore
```

### 2. Rate Limiting

Add rate limiting to API routes to prevent abuse:

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

### 3. Input Validation

Add validation to all API routes:

```typescript
// Example for Jira API routes
import { z } from 'zod';

const updateStoryPointsSchema = z.object({
  issueKey: z.string().regex(/^[A-Z]+-\d+$/),
  storyPoints: z.number().min(0).max(100),
  cloudId: z.string().uuid(),
});
```

### 4. CORS Configuration

Restrict API access to your domain only in production.

### 5. Content Security Policy

Add CSP headers in `next.config.ts`:

```typescript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
];
```

## ⚡ Performance Optimizations

### 1. Reduce Presence Update Frequency

**Current**: Updates every 30 seconds
**Recommendation**: Increase to 60 seconds or use connection state

```typescript
// app/room/[room-id]/page.tsx
const interval = setInterval(() => {
  updateDoc(participantRef, {
    lastSeen: serverTimestamp(),
  });
}, 60000); // Changed from 30000 to 60000
```

**Savings**: 50% reduction in writes (~43K writes/month saved)

### 2. Use Firebase Connection State

Instead of polling, use Firebase's built-in connection state:

```typescript
import { onDisconnect } from 'firebase/database';
// More efficient than polling
```

### 3. Implement Pagination for Ticket Lists

For rooms with many tickets, add pagination:

```typescript
const q = query(
  collection(db, 'tickets'),
  where('roomId', '==', roomId),
  orderBy('order', 'asc'),
  limit(20) // Add pagination
);
```

### 4. Optimize Real-time Listeners

**Current**: 6 active listeners per room page
**Recommendation**: Unsubscribe when components unmount (already doing this ✅)

### 5. Add Indexes

Create composite indexes in Firebase Console for:
- `tickets`: `roomId` + `status` + `order`
- `votes`: `storyId` + `voterId`

### 6. Implement Cleanup Job

Add a Cloud Function to clean up old data:

```typescript
// Delete completed sessions older than 90 days
// Delete inactive participants
// Archive old votes
```

## 📊 Monitoring

### 1. Firebase Usage Dashboard

Monitor in Firebase Console:
- Firestore → Usage tab
- Check daily read/write counts
- Set up budget alerts

### 2. Error Tracking

Add error tracking service:
- Sentry
- LogRocket
- Firebase Crashlytics

### 3. Performance Monitoring

Enable Firebase Performance Monitoring:

```typescript
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);
```

## 🎯 Cost Optimization Strategy

### Current Estimated Costs (Free Tier)

**Scenario: 10 users, 20 sessions/month**
- Reads: ~500K/month (within 1.5M limit) ✅
- Writes: ~93K/month (within 600K limit) ✅
- **Cost: $0/month**

### Scaling Projections

**50 users, 100 sessions/month:**
- Reads: ~2.5M/month
- Writes: ~465K/month
- **Estimated cost: $0-5/month** (may exceed free tier reads)

**100 users, 200 sessions/month:**
- Reads: ~5M/month
- Writes: ~930K/month
- **Estimated cost: $10-20/month**

### Cost Reduction Tips

1. **Batch writes** where possible
2. **Cache frequently accessed data** client-side
3. **Use Firebase Emulator** for development
4. **Implement data archival** for old sessions
5. **Consider upgrading to Blaze plan** only when needed (pay-as-you-go)

## 🔐 Security Checklist

- [ ] Deploy Firestore security rules
- [ ] Integrate Firebase Anonymous Auth for guests
- [ ] Add rate limiting to API routes
- [ ] Implement input validation
- [ ] Add CSP headers
- [ ] Set up error tracking
- [ ] Configure CORS properly
- [ ] Review and rotate API keys regularly
- [ ] Enable 2FA for Firebase Console access
- [ ] Set up backup strategy

## 📝 Deployment Checklist

- [ ] Update Atlassian OAuth callback URL to production domain
- [ ] Deploy Firestore security rules
- [ ] Set all environment variables in production
- [ ] Test authentication flow in production
- [ ] Verify Jira integration works
- [ ] Monitor Firebase usage for first week
- [ ] Set up budget alerts in Firebase Console
