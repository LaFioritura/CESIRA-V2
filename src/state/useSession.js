import { useEffect, useReducer } from 'react';
import { loadSession, saveSession, sessionReducer } from './session';

export function useSession() {
  const [session, dispatch] = useReducer(sessionReducer, undefined, loadSession);

  useEffect(() => {
    saveSession(session);
  }, [session]);

  return [session, dispatch];
}
