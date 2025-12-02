import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { FlowRenderer } from '../../components/flow/FlowRenderer';
import { FlowMessages } from '../../components/flow/FlowMessages';
import { KratosFlow, UiText } from '../../types/kratos';
import {
  useCreateRegistrationFlow,
  useSessionQuery,
  useSubmitRegistrationFlow,
} from '../../queries/auth.query';
import {
  extractFlowFromError,
  extractErrorMessage,
  isCsrfError,
  clearCookies,
} from '../../utils/kratos';

export default function RegistrationPage() {
  console.log('RegistrationPage component rendered');

  const navigate = useNavigate();
  const [flow, setFlow] = useState<KratosFlow | null>(null);
  const [errorMessages, setErrorMessages] = useState<UiText[]>([]);

  const createFlowMutation = useCreateRegistrationFlow();
  const submitFlowMutation = useSubmitRegistrationFlow();
  const sessionQuery = useSessionQuery(false);
  const hasInitialized = useRef(false);

  const initializeFlow = useCallback(async () => {
    console.log('initializeFlow called');
    if (createFlowMutation.isPending) {
      console.log('Already pending, skipping');
      return;
    }
    setErrorMessages([]);
    try {
      console.log('Calling mutateAsync...');
      const data = await createFlowMutation.mutateAsync(undefined);
      console.log('mutateAsync response:', data);
      setFlow(data as KratosFlow);
    } catch (error) {
      console.error('initializeFlow error:', error);
      const messages = extractErrorMessage(error);
      setErrorMessages(messages);
    }
  }, [createFlowMutation]);

  useEffect(() => {
    if (hasInitialized.current) {
      console.log('Already initialized, skipping');
      return;
    }

    hasInitialized.current = true;
    setErrorMessages([]);
    initializeFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (payload: Record<string, string | boolean>) => {
    if (!flow) return;

    // Check if CSRF token is present
    if (!payload.csrf_token) {
      setErrorMessages([
        {
          text: 'CSRF token không tìm thấy. Vui lòng tải lại trang và thử lại.',
          type: 'error',
        },
      ]);
      return;
    }

    setErrorMessages([]);
    try {
      const response = await submitFlowMutation.mutateAsync({
        flowId: flow.id,
        payload,
      });

      console.log('Submit registration response:', response);

      // Extract flow from response (could be direct flow object or wrapped in 'data')
      let flowData: KratosFlow | undefined;
      if (
        response &&
        typeof response === 'object' &&
        'data' in response &&
        response.data &&
        typeof response.data === 'object' &&
        'id' in response.data &&
        'ui' in response.data
      ) {
        // Response is wrapped: { data: { id, ui, ... } }
        flowData = response.data as KratosFlow;
      } else if (
        response &&
        typeof response === 'object' &&
        'id' in response &&
        'ui' in response
      ) {
        // Response is direct flow object
        flowData = response as KratosFlow;
      }

      // Check if response is a flow continuation (multi-step flow)
      if (flowData) {
        console.log('Flow detected:', {
          id: flowData.id,
          state: flowData.state,
          hasNodes: !!flowData.ui?.nodes?.length,
          nodesCount: flowData.ui?.nodes?.length,
        });

        // A flow is considered "in progress" if:
        // 1. It has a state that is not 'success' (e.g., 'choose_method')
        // 2. OR it has ui.nodes (meaning there are still form fields to fill)
        const isInProgress =
          (flowData.state && flowData.state !== 'success') ||
          (flowData.ui?.nodes && flowData.ui.nodes.length > 0);

        if (isInProgress) {
          console.log('Flow continuation detected, updating flow');
          setFlow(flowData);
          return;
        }
      }

      console.log('Flow completed, navigating to /me');
      // Flow completed successfully, check session and navigate
      await sessionQuery.refetch();
      navigate({ to: '/me' });
    } catch (error) {
      console.error('Submit registration error:', error);

      // Handle CSRF error - clear cookies and recreate flow
      if (isCsrfError(error)) {
        setErrorMessages([
          {
            text: 'Lỗi bảo mật CSRF. Đang xóa cookies và tạo lại flow...',
            type: 'error',
          },
        ]);
        // Clear cookies to start fresh
        clearCookies();
        // Reset and recreate flow
        hasInitialized.current = false;
        // Wait a bit for cookies to be cleared
        await new Promise((resolve) => setTimeout(resolve, 100));
        await initializeFlow();
        return;
      }

      // Try to extract flow from error (for validation errors)
      const retryFlow = extractFlowFromError(error);
      if (retryFlow) {
        setFlow(retryFlow);
        setErrorMessages(retryFlow.ui.messages ?? []);
        return;
      }

      // Extract and display error message
      const errorMessages = extractErrorMessage(error);
      setErrorMessages(errorMessages);
    }
  };

  return (
    <section className="page-card">
      <h1>Đăng ký</h1>
      <FlowMessages messages={errorMessages} />
      {flow ? (
        <FlowRenderer flow={flow} onSubmit={handleSubmit} />
      ) : createFlowMutation.isPending ? (
        <p>Đang khởi tạo flow...</p>
      ) : createFlowMutation.isError ? (
        <p>Lỗi khi khởi tạo flow. Vui lòng thử lại.</p>
      ) : (
        <p>Đang khởi tạo flow...</p>
      )}
      <div className="auth-switch">
        <p>
          Đã có tài khoản?{' '}
          <button
            type="button"
            className="auth-switch__link"
            onClick={() => navigate({ to: '/login' })}
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>
    </section>
  );
}
