import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';
import ApiAuth, { FlowSubmitPayload } from '../api/auth.api';
import { BrowserFlowParams, KratosFlow, LogoutFlowResponse, SessionPayload } from '../types/kratos';
import { useSessionStore } from '../stores/session.store';

const queryKeys = {
  session: ['session'] as const,
};

export function useSessionQuery(enabled = true) {
  const setSession = useSessionStore((state) => state.setSession);
  const clear = useSessionStore((state) => state.clear);

  const query = useQuery<SessionPayload>({
    queryKey: queryKeys.session,
    queryFn: async () => {
      return await ApiAuth.getSession();
    },
    enabled,
    retry: 0,
  });

  useEffect(() => {
    if (query.data) {
      // Unwrap response if it's wrapped in 'data' property (from TransformInterceptor)
      const responseData = (query.data as any)?.data || query.data;
      setSession({
        identity: responseData?.identity,
        session: responseData?.session,
      });
    }
  }, [query.data, setSession]);

  useEffect(() => {
    if (query.error) {
      clear();
    }
  }, [query.error, clear]);

  return query;
}

export function useCreateLoginFlow() {
  return useMutation({
    mutationFn: (params?: BrowserFlowParams) =>
      ApiAuth.createLoginFlow(params),
  });
}

export function useSubmitLoginFlow() {
  return useMutation({
    mutationFn: async ({
      flowId,
      payload,
    }: {
      flowId: string;
      payload: FlowSubmitPayload;
    }) => {
      const response = await ApiAuth.submitLoginFlow(flowId, payload);
      console.log('useSubmitLoginFlow response:', response);
      return response as KratosFlow;
    },
  });
}

export function useCreateRegistrationFlow() {
  return useMutation({
    mutationFn: async (params?: BrowserFlowParams) => {
      const response = await ApiAuth.createRegistrationFlow(params);
      console.log('useCreateRegistrationFlow response:', response);
      return response;
    },
  });
}

export function useSubmitRegistrationFlow() {
  return useMutation({
    mutationFn: ({
      flowId,
      payload,
    }: {
      flowId: string;
      payload: FlowSubmitPayload;
    }) => ApiAuth.submitRegistrationFlow(flowId, payload),
  });
}

export function useCreateLogoutFlow() {
  return useMutation({
    mutationFn: async (params?: { returnTo?: string }) => {
      const response = await ApiAuth.createLogoutFlow(params);
      // Response could be wrapped in 'data' by TransformInterceptor
      const responseData = (response as any)?.data || response;
      return responseData as LogoutFlowResponse;
    },
  });
}

export function useSubmitLogoutFlow() {
  const queryClient = useQueryClient();
  const clear = useSessionStore((state) => state.clear);

  return useMutation({
    mutationFn: (logoutToken: string) =>
      ApiAuth.submitLogoutFlow(logoutToken),
    onSuccess: () => {
      clear();
      queryClient.invalidateQueries({ queryKey: queryKeys.session });
    },
  });
}


