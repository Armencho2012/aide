import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UseUsageLimitReturn {
  usageCount: number;
  dailyLimit: number;
  userPlan: 'free' | 'pro' | 'class';
  isLocked: boolean;
  isLoading: boolean;
  refreshUsage: (userId: string) => Promise<void>;
}

const DAILY_LIMIT_FREE = 1;
const DAILY_LIMIT_PRO = 50;
const DAILY_LIMIT_CLASS = Infinity;

/**
 * Custom hook for managing usage limits and plan information
 * Handles fetching subscription data and remaining analyses
 */
export const useUsageLimit = (): UseUsageLimitReturn => {
  const [usageCount, setUsageCount] = useState(1);
  const [dailyLimit, setDailyLimit] = useState(DAILY_LIMIT_FREE);
  const [userPlan, setUserPlan] = useState<'free' | 'pro' | 'class'>('free');
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const refreshUsage = useCallback(async (userId: string) => {
    if (!userId) return;

    setIsLoading(true);
    try {
      // Get subscription info
      const { data: subscriptionData, error: subError } = await supabase
        .from('subscriptions')
        .select('status, plan_type, expires_at')
        .eq('user_id', userId)
        .single();

      let plan: 'free' | 'pro' | 'class' = 'free';
      let limit = DAILY_LIMIT_FREE;

      if (!subError && subscriptionData) {
        const isActive =
          subscriptionData.status === 'active' &&
          ['pro', 'class'].includes(subscriptionData.plan_type) &&
          (!subscriptionData.expires_at ||
            new Date(subscriptionData.expires_at) > new Date());

        if (isActive) {
          plan = subscriptionData.plan_type as 'pro' | 'class';
          limit =
            plan === 'class'
              ? DAILY_LIMIT_CLASS
              : plan === 'pro'
              ? DAILY_LIMIT_PRO
              : DAILY_LIMIT_FREE;
        }
      }

      setUserPlan(plan);
      setDailyLimit(limit);

      // Get usage count
      if (plan === 'class') {
        setUsageCount(Infinity);
        setIsLocked(false);
      } else {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const { count, error: countError } = await supabase
          .from('usage_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('action_type', 'analysis')
          .gte('created_at', today.toISOString());

        const usedCount = countError ? 0 : count ?? 0;
        const remainingCount = Math.max(0, limit - usedCount);

        setUsageCount(remainingCount);
        setIsLocked(remainingCount <= 0 && plan === 'free');
      }
    } catch (error) {
      console.error('Error fetching usage:', error);
      // Default to free tier on error
      setUserPlan('free');
      setDailyLimit(DAILY_LIMIT_FREE);
      setUsageCount(0);
      setIsLocked(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    usageCount,
    dailyLimit,
    userPlan,
    isLocked,
    isLoading,
    refreshUsage,
  };
};
