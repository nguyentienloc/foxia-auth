import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useSessionQuery } from '../queries/auth.query';
import { useSessionStore } from '../stores/session.store';

export function IndexRedirect() {
  const navigate = useNavigate();
  const sessionQuery = useSessionQuery(true);
  const session = useSessionStore((state) => state.session);

  useEffect(() => {
    if (sessionQuery.data?.session || session) {
      navigate({ to: '/me' });
    } else {
    navigate({ to: '/login' });
    }
  }, [navigate, sessionQuery.data, session]);

  return null;
}


