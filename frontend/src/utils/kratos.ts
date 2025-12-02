import { AxiosError } from 'axios';
import { KratosFlow, UiText } from '../types/kratos';

export function extractFlowFromError(error: unknown): KratosFlow | undefined {
  const axiosError = error as AxiosError<{ error?: any; data?: KratosFlow }>;
  
  // Check if response has flow data (wrapped by TransformInterceptor)
  if (axiosError?.response?.data?.data) {
    return axiosError.response.data.data;
  }
  
  // Check if response is directly a flow
  if (axiosError?.response?.data && 'id' in axiosError.response.data && 'ui' in axiosError.response.data) {
    return axiosError.response.data as KratosFlow;
  }
  
  return undefined;
}

export function extractErrorMessage(error: unknown): UiText[] {
  const axiosError = error as AxiosError<any>;
  const responseData = axiosError?.response?.data;
  
  if (!responseData) {
    return [{ text: 'Đã xảy ra lỗi, vui lòng thử lại.', type: 'error' }];
  }
  
  // Handle error wrapped by TransformInterceptor: { data: { error: {...} } }
  const errorData = responseData.data?.error || responseData.error || responseData;
  
  // If errorData is the direct error object (not wrapped)
  if (errorData && typeof errorData === 'object') {
    const messages: UiText[] = [];
    
    // Extract message (highest priority)
    if (errorData.message) {
      messages.push({
        text: errorData.message,
        type: 'error',
        id: errorData.id,
      });
    }
    
    // Extract reason if no message
    if (messages.length === 0 && errorData.reason) {
      messages.push({
        text: errorData.reason,
        type: 'error',
        id: errorData.id,
      });
    }
    
    // Extract hint from details
    if (errorData.details?.hint) {
      messages.push({
        text: errorData.details.hint,
        type: 'info',
      });
    }
    
    if (messages.length > 0) {
      return messages;
    }
  }
  
  // Fallback to response message
  if (responseData.message) {
    return [{ text: responseData.message, type: 'error' }];
  }
  
  // Fallback to status text
  if (axiosError?.response?.statusText) {
    return [{ text: axiosError.response.statusText, type: 'error' }];
  }
  
  // Generic error
  return [{ text: 'Đã xảy ra lỗi, vui lòng thử lại.', type: 'error' }];
}

export function isCsrfError(error: unknown): boolean {
  const axiosError = error as AxiosError<{ error?: any }>;
  return axiosError?.response?.data?.error?.id === 'security_csrf_violation';
}

/**
 * Clear all cookies for the current domain
 * This is useful when encountering CSRF errors to start fresh
 */
export function clearCookies(): void {
  if (typeof document === 'undefined') {
    return;
  }

  // Get all cookies
  const cookies = document.cookie.split(';');

  // Clear each cookie
  cookies.forEach((cookie) => {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    
    // Clear cookie by setting it to expire in the past
    // Try multiple paths and domains to ensure it's cleared
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
  });
}


