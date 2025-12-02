import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import {
  useCreateLogoutFlow,
  useSubmitLogoutFlow,
} from '../../queries/auth.query';
import { FlowMessages } from '../../components/flow/FlowMessages';
import { LogoutFlowResponse, UiText } from '../../types/kratos';
import { extractErrorMessage } from '../../utils/kratos';

export default function LogoutPage() {
  const navigate = useNavigate();
  const [logoutToken, setLogoutToken] = useState<string | null>(null);
  const [errorMessages, setErrorMessages] = useState<UiText[]>([]);
  const createLogoutFlow = useCreateLogoutFlow();
  const submitLogoutFlow = useSubmitLogoutFlow();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;
    setErrorMessages([]);

    createLogoutFlow
      .mutateAsync(undefined)
      .then((data) => {
        const response = data as LogoutFlowResponse;
        console.log('Logout flow response:', response);
        if (response.logout_token) {
          setLogoutToken(response.logout_token);
        } else if (response.logout_url) {
          window.location.href = response.logout_url;
        }
      })
      .catch((error) => {
        console.error('Error creating logout flow:', error);
        const messages = extractErrorMessage(error);
        setErrorMessages(messages);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    if (!logoutToken) return;
    setErrorMessages([]);
    try {
      await submitLogoutFlow.mutateAsync(logoutToken);
      navigate({ to: '/login' });
    } catch (error) {
      console.error('Error submitting logout:', error);
      const messages = extractErrorMessage(error);
      setErrorMessages(messages);
    }
  };

  return (
    <section className="page-card">
      <h1>Đăng xuất</h1>
      <FlowMessages messages={errorMessages} />

      {logoutToken ? (
        <button
          className="flow-submit"
          onClick={handleLogout}
          disabled={submitLogoutFlow.isPending}
        >
          Đăng xuất ngay
        </button>
      ) : (
        <p>Đang khởi tạo flow...</p>
      )}
    </section>
  );
}
