import Api from '../core/api';
import {
  BrowserFlowParams,
  KratosFlow,
  LogoutFlowResponse,
  SessionPayload,
} from '../types/kratos';

export type FlowSubmitPayload = Record<string, unknown>;

class ApiAuth extends Api {
  createLoginFlow = async (params?: BrowserFlowParams) => {
    const response = await this.GET('/auth/login/browser', params);
    return response?.data as KratosFlow;
  };

  submitLoginFlow = async (flowId: string, payload: FlowSubmitPayload) => {
    // Extract CSRF token and send in both body and header for better compatibility
    const csrfToken = payload.csrf_token as string | undefined;
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await this.paramsPOST<KratosFlow>(
      '/auth/login',
      { flow: flowId },
      payload,
      { headers },
    );
    return response;
  };

  createRegistrationFlow = async (params?: BrowserFlowParams) => {
    const response = await this.GET(
      '/auth/registration/browser',
      params,
    );
    return response?.data as KratosFlow;
  };

  submitRegistrationFlow = async (
    flowId: string,
    payload: FlowSubmitPayload,
  ) => {
    // Extract CSRF token and send in both body and header for better compatibility
    const csrfToken = payload.csrf_token as string | undefined;
    const headers: Record<string, string> = {};
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }

    const response = await this.paramsPOST<KratosFlow>(
      '/auth/registration',
      { flow: flowId },
      payload,
      { headers },
    );
    return response;
  };

  getSession = async () => {
    const response = await this.GET<SessionPayload>('/auth/me');
    return response;
  };

  createLogoutFlow = async (params?: { returnTo?: string }) => {
    const response = await this.GET<LogoutFlowResponse>(
      '/auth/logout/browser',
      params,
    );
    return response;
  };

  submitLogoutFlow = async (logoutToken: string) => {
    const response = await this.POST<{ success: boolean }>('/auth/logout', {
      logout_token: logoutToken,
    });
    return response;
  };

  getErrorFlow = async (errorId: string) => {
    const response = await this.GET('/auth/error', { id: errorId });
    return response;
  };
}
const baseURL = import.meta.env.VITE_IDENTITY_API_URL ?? "/api";

export default new ApiAuth(baseURL);
