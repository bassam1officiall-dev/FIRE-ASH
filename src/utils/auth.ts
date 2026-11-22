import type { User } from 'firebase/auth';

/**
 * Checks if the currently authenticated user has the Manager role.
 * User must match manager@fireandash.local (case-insensitive).
 */
export const isManager = (user: User | null | undefined): boolean => {
  return user?.email?.toLowerCase() === 'manager@fireandash.local';
};
