import { useSessionStore } from '../stores/session.store';
import ApiAuth from '../api/auth.api';

/**
 * Check if user is authenticated by checking session in store
 * This can be used outside React components
 * Checks both identity and session to ensure user is truly authenticated
 */
export function isAuthenticated(): boolean {
  const state = useSessionStore.getState();
  // Check identity first as it's the primary indicator of authentication
  // Also check session exists and is not an empty object
  const hasIdentity = !!state.identity?.id;
  const hasSession = !!state.session && Object.keys(state.session).length > 0;
  return hasIdentity || hasSession;
}

/**
 * Check session from API (async)
 * Useful for route guards
 * Also updates store if session is found
 */
export async function checkSessionFromAPI(): Promise<boolean> {
  try {
    const response = await ApiAuth.getSession();
    // Unwrap response if it's wrapped in 'data' property (from TransformInterceptor)
    const sessionData = (response as any)?.data || response;
    
    if (sessionData?.identity || sessionData?.session) {
      // Update store with session data
      useSessionStore.getState().setSession({
        identity: sessionData?.identity,
        session: sessionData?.session,
      });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
