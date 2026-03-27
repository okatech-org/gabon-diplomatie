/**
 * Rate limiter configuration for AI Chat
 * Limits: 20 messages per minute per user, with burst capacity of 5
 */
import { RateLimiter, MINUTE } from "@convex-dev/rate-limiter";
import { components } from "../_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  // AI Chat: 20 messages per minute per user
  // Token bucket allows small bursts (5 messages) then rate limited
  aiChat: { 
    kind: "token bucket", 
    rate: 20, 
    period: MINUTE, 
    capacity: 5 
  },
});
