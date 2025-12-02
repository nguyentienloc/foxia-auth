import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';

export function IndexRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: '/login' });
  }, [navigate]);

  return null;
}


