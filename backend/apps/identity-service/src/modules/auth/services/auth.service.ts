import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
  Inject,
} from '@nestjs/common';
import { AxiosRequestConfig, isAxiosError, default as axios } from 'axios';
import {
  FrontendApi,
  LoginFlow,
  RegistrationFlow,
  UpdateLoginFlowBody,
  UpdateRegistrationFlowBody,
  LogoutFlow,
  FrontendApiCreateBrowserLoginFlowRequest,
  FrontendApiCreateBrowserRegistrationFlowRequest,
  FrontendApiCreateBrowserLogoutFlowRequest,
} from '@ory/kratos-client';
import { KRATOS_FRONTEND_API } from 'core/auth/providers/kratos.provider';
import { BrowserFlowQueryDto } from '../dtos/browser-flow-query.dto';
import { FlowQueryDto } from '../dtos/flow-query.dto';
import { LogoutFlowDto } from '../dtos/logout-flow.dto';
import { LogoutFlowQueryDto } from '../dtos/logout-flow-query.dto';

interface FlowResponse<T = void> {
  data?: T;
  cookies?: string[];
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(KRATOS_FRONTEND_API)
    private readonly frontendApi: FrontendApi,
  ) {}

  async createBrowserLoginFlow(
    query: BrowserFlowQueryDto,
    cookie?: string,
  ): Promise<FlowResponse<LoginFlow>> {
    const { data, headers } = await this.frontendApi
      .createBrowserLoginFlow(
        this.toBrowserLoginParams(query),
        this.buildAxiosConfig(cookie),
      )
      .catch((error) => {
        throw this.normalizeError(error);
      });
    return {
      data,
      cookies: this.extractCookies(headers),
    };
  }

  async updateLoginFlow(
    query: FlowQueryDto,
    body: UpdateLoginFlowBody,
    cookie?: string,
  ): Promise<FlowResponse<LoginFlow>> {
    try {
      const { data, headers } = await this.frontendApi.updateLoginFlow(
        {
          flow: query.flow,
          updateLoginFlowBody: body,
        },
        this.buildAxiosConfig(cookie),
      );

      return {
        data: data as unknown as LoginFlow,
        cookies: this.extractCookies(headers),
      };
    } catch (error) {
      // Check if error response contains redirect_browser_to (OIDC flow)
      if (isAxiosError(error)) {
        const errorData = error.response?.data;
        
        // Check for OIDC redirect
        if (
          errorData &&
          typeof errorData === 'object' &&
          'redirect_browser_to' in errorData
        ) {
          const cookies = this.extractCookies(error.response?.headers);
          if (process.env.NODE_ENV === 'development') {
            console.log('OIDC redirect detected, cookies:', cookies);
          }
          // Return redirect URL in a special format so controller can handle it
          return {
            data: {
              redirect_browser_to: errorData.redirect_browser_to,
            } as any,
            cookies: cookies,
          };
        }
        
        // Check if error response contains a flow (flow continuation)
        if (
          errorData &&
          typeof errorData === 'object' &&
          'id' in errorData &&
          'ui' in errorData
        ) {
          // This is a flow continuation, return it as success
          return {
            data: errorData as unknown as LoginFlow,
            cookies: this.extractCookies(error.response?.headers),
          };
        }
      }
      throw this.normalizeError(error);
    }
  }

  async createBrowserRegistrationFlow(
    query: BrowserFlowQueryDto,
    cookie?: string,
  ): Promise<FlowResponse<RegistrationFlow>> {
    const { data, headers } = await this.frontendApi
      .createBrowserRegistrationFlow(
        this.toBrowserRegistrationParams(query),
        this.buildAxiosConfig(cookie),
      )
      .catch((error) => {
        throw this.normalizeError(error);
      });

    return {
      data,
      cookies: this.extractCookies(headers),
    };
  }

  async updateRegistrationFlow(
    query: FlowQueryDto,
    body: UpdateRegistrationFlowBody,
    cookie?: string,
  ): Promise<FlowResponse<RegistrationFlow>> {
    try {
      const { data, headers } = await this.frontendApi.updateRegistrationFlow(
        {
          flow: query.flow,
          updateRegistrationFlowBody: body,
        },
        this.buildAxiosConfig(cookie),
      );

      return {
        data: data as unknown as RegistrationFlow,
        cookies: this.extractCookies(headers),
      };
    } catch (error) {
      // Check if error response contains a flow (flow continuation)
      if (isAxiosError(error)) {
        const flowData = error.response?.data;
        if (
          flowData &&
          typeof flowData === 'object' &&
          'id' in flowData &&
          'ui' in flowData
        ) {
          // This is a flow continuation, return it as success
          return {
            data: flowData as unknown as RegistrationFlow,
            cookies: this.extractCookies(error.response?.headers),
          };
        }
      }
      throw this.normalizeError(error);
    }
  }

  async createBrowserLogoutFlow(
    query: LogoutFlowQueryDto,
    cookie?: string,
  ): Promise<FlowResponse<LogoutFlow>> {
    const { data, headers } = await this.frontendApi
      .createBrowserLogoutFlow(
        this.toLogoutParams(query),
        this.buildAxiosConfig(cookie),
      )
      .catch((error) => {
        throw this.normalizeError(error);
      });

    return {
      data,
      cookies: this.extractCookies(headers),
    };
  }

  async updateLogoutFlow(
    body: LogoutFlowDto,
    cookie?: string,
  ): Promise<FlowResponse> {
    const { headers } = await this.frontendApi
      .updateLogoutFlow(
        {
          token: body.logout_token,
        },
        this.buildAxiosConfig(cookie),
      )
      .catch((error) => {
        throw this.normalizeError(error);
      });

    return {
      cookies: this.extractCookies(headers),
    };
  }

  private buildAxiosConfig(cookie?: string): AxiosRequestConfig {
    const headers: Record<string, string> = {};
    if (cookie) {
      headers.cookie = cookie;
    }

    return {
      headers,
      withCredentials: true,
    };
  }

  private extractCookies(headers?: unknown) {
    const raw = headers && (headers as any)['set-cookie'];
    if (!raw) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No Set-Cookie header in Kratos response');
        console.log('Response headers:', headers);
      }
      return undefined;
    }
    const cookies = Array.isArray(raw) ? raw : [raw];
    if (process.env.NODE_ENV === 'development') {
      console.log('Extracted cookies from Kratos:', cookies);
    }
    return cookies;
  }

  private toBrowserLoginParams(
    query: BrowserFlowQueryDto,
  ): FrontendApiCreateBrowserLoginFlowRequest {
    return {
      ...(query.returnTo ? { returnTo: query.returnTo } : {}),
      ...(query.aal ? { aal: query.aal } : {}),
      ...(typeof query.refresh === 'boolean'
        ? { refresh: query.refresh }
        : {}),
    };
  }

  private toBrowserRegistrationParams(
    query: BrowserFlowQueryDto,
  ): FrontendApiCreateBrowserRegistrationFlowRequest {
    return {
      ...(query.returnTo ? { returnTo: query.returnTo } : {}),
    };
  }

  private toLogoutParams(
    query: LogoutFlowQueryDto,
  ): FrontendApiCreateBrowserLogoutFlowRequest {
    return {
      ...(query.returnTo ? { returnTo: query.returnTo } : {}),
    };
  }

  async getErrorFlow(errorId: string, cookie?: string): Promise<any> {
    // Kratos error endpoint: GET /self-service/errors?id=<error_id>
    // We need to call this directly via axios since FrontendApi might not have this method
    const basePath = process.env.KRATOS_PUBLIC_URL;
    if (!basePath) {
      throw new Error('KRATOS_PUBLIC_URL is not defined');
    }

    const config: AxiosRequestConfig = {
      method: 'GET',
      url: `${basePath}/self-service/errors`,
      params: { id: errorId },
      headers: cookie ? { cookie } : {},
      withCredentials: true,
    };

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  private normalizeError(error: unknown) {
    if (isAxiosError(error)) {
      const status = error.response?.status ?? 500;
      const payload = error.response?.data;

      if (status === 400 || status === 422) {
        throw new BadRequestException(payload);
      }

      if (status === 401) {
        throw new UnauthorizedException(payload);
      }

      throw new InternalServerErrorException(payload);
    }

    throw error;
  }
}
