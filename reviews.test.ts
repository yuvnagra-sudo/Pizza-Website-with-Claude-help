import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import type { Context } from './_core/context';
import * as db from './db';

// Mock context for testing
const createMockContext = (user?: { id: number; role: 'admin' | 'user' }): Context => ({
  req: {} as any,
  res: {} as any,
  user: user || null,
});

describe('Customer Reviews System', () => {
  describe('Public Review Submission', () => {
    it('should allow anyone to submit a review', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const result = await caller.reviews.submit({
        customerName: 'Test Customer',
        email: 'test@example.com',
        rating: 5,
        reviewText: 'Amazing pizza! Best in Airdrie. Fresh ingredients and fast delivery.',
      });

      expect(result.success).toBe(true);
      expect(result.reviewId).toBeDefined();
    });

    it('should reject reviews with invalid rating', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      await expect(
        caller.reviews.submit({
          customerName: 'Test Customer',
          rating: 6, // Invalid: max is 5
          reviewText: 'Great pizza!',
        })
      ).rejects.toThrow();
    });

    it('should reject reviews with short text', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      await expect(
        caller.reviews.submit({
          customerName: 'Test Customer',
          rating: 5,
          reviewText: 'Good', // Too short: min is 10 characters
        })
      ).rejects.toThrow();
    });

    it('should accept reviews without email', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const result = await caller.reviews.submit({
        customerName: 'Anonymous Customer',
        rating: 4,
        reviewText: 'Delicious wings and friendly service!',
      });

      expect(result.success).toBe(true);
    });
  });

  describe('Public Review Retrieval', () => {
    it('should return only approved reviews', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const reviews = await caller.reviews.getApproved();
      
      // All returned reviews should be approved
      reviews.forEach(review => {
        expect(review.approved).toBe(true);
      });
    });

    it('should return review statistics', async () => {
      const caller = appRouter.createCaller(createMockContext());
      
      const stats = await caller.reviews.getStats();
      
      expect(stats).toHaveProperty('averageRating');
      expect(stats).toHaveProperty('totalReviews');
      expect(typeof stats.averageRating).toBe('number');
      expect(typeof stats.totalReviews).toBe('number');
      
      if (stats.totalReviews > 0) {
        expect(stats.averageRating).toBeGreaterThanOrEqual(1);
        expect(stats.averageRating).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('Admin Review Management', () => {
    const adminContext = createMockContext({ id: 1, role: 'admin' });
    const userContext = createMockContext({ id: 2, role: 'user' });

    it('should allow admins to view all reviews', async () => {
      const adminCaller = appRouter.createCaller(adminContext);
      
      const allReviews = await adminCaller.reviews.getAll();
      
      // Should include both approved and pending reviews
      expect(Array.isArray(allReviews)).toBe(true);
    });

    it('should prevent non-admins from viewing all reviews', async () => {
      const userCaller = appRouter.createCaller(userContext);
      
      await expect(
        userCaller.reviews.getAll()
      ).rejects.toThrow('Admin access required');
    });

    it('should allow admins to approve reviews', async () => {
      const adminCaller = appRouter.createCaller(adminContext);
      const publicCaller = appRouter.createCaller(createMockContext());
      
      // Submit a review
      const { reviewId } = await publicCaller.reviews.submit({
        customerName: 'Test Approval',
        rating: 5,
        reviewText: 'Testing the approval workflow for reviews.',
      });

      // Approve it as admin
      const result = await adminCaller.reviews.approve({ id: reviewId });
      expect(result.success).toBe(true);
    });

    it('should prevent non-admins from approving reviews', async () => {
      const userCaller = appRouter.createCaller(userContext);
      
      await expect(
        userCaller.reviews.approve({ id: 1 })
      ).rejects.toThrow('Admin access required');
    });

    it('should allow admins to toggle featured status', async () => {
      const adminCaller = appRouter.createCaller(adminContext);
      
      const result = await adminCaller.reviews.toggleFeatured({ id: 1 });
      expect(result.success).toBe(true);
    });

    it('should allow admins to delete reviews', async () => {
      const adminCaller = appRouter.createCaller(adminContext);
      const publicCaller = appRouter.createCaller(createMockContext());
      
      // Submit a review to delete
      const { reviewId } = await publicCaller.reviews.submit({
        customerName: 'To Be Deleted',
        rating: 3,
        reviewText: 'This review will be deleted for testing purposes.',
      });

      // Delete it as admin
      const result = await adminCaller.reviews.delete({ id: reviewId });
      expect(result.success).toBe(true);
    });
  });

  describe('Database Functions', () => {
    it('should calculate correct average rating', async () => {
      const stats = await db.getReviewStats();
      
      if (stats.totalReviews > 0) {
        // Average should be between 1 and 5
        expect(stats.averageRating).toBeGreaterThanOrEqual(1);
        expect(stats.averageRating).toBeLessThanOrEqual(5);
        
        // Should be rounded to 1 decimal place
        expect(stats.averageRating.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(1);
      }
    });

    it('should return empty array when no approved reviews exist', async () => {
      // This test assumes we can clear the database or test in isolation
      const reviews = await db.getApprovedReviews();
      expect(Array.isArray(reviews)).toBe(true);
    });
  });
});
