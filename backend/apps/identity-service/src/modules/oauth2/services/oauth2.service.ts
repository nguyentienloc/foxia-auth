import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import {
  OAuth2Api,
  WellknownApi,
  OidcApi,
  OAuth2Client,
  IntrospectedOAuth2Token,
} from '@ory/hydra-client';
import {
  HYDRA_ADMIN_API,
  HYDRA_PUBLIC_API,
  HYDRA_WELLKNOWN_API,
  HYDRA_OIDC_API,
} from 'core/auth/providers/hydra.provider';
import { ClientCredentialsDto } from '../dtos/client-credentials.dto';
import { CreateOAuth2ClientDto } from '../dtos/create-client.dto';
import { TokenResponseDto } from '../dtos/token-response.dto';
import { HydraKratosIntegrationService } from './hydra-kratos-integration.service';
import { isAxiosError, default as axios } from 'axios';

@Injectable()
export class OAuth2Service {
  constructor(
    @Inject(HYDRA_ADMIN_API)
    private readonly hydraAdminApi: OAuth2Api,
    @Inject(HYDRA_PUBLIC_API)
    private readonly hydraPublicApi: OAuth2Api,
    @Inject(HYDRA_WELLKNOWN_API)
    private readonly hydraWellknownApi: WellknownApi,
    @Inject(HYDRA_OIDC_API)
    private readonly hydraOidcApi: OidcApi,
    private readonly hydraKratosIntegration: HydraKratosIntegrationService,
  ) {}

  /**
   * Handle Client Credentials Flow
   * This flow is used for server-to-server authentication
   */
  async handleClientCredentialsFlow(
    dto: ClientCredentialsDto,
  ): Promise<TokenResponseDto> {
    try {
      // Validate grant type
      if (dto.grant_type !== 'client_credentials') {
        throw new BadRequestException(
          'Invalid grant_type. Must be "client_credentials"',
        );
      }

      // Request token from Hydra Public API
      const formData = new URLSearchParams();
      formData.append('grant_type', dto.grant_type);
      formData.append('client_id', dto.client_id);
      formData.append('client_secret', dto.client_secret);
      if (dto.scope) {
        formData.append('scope', dto.scope);
      }

      // Use axios to call Hydra token endpoint directly
      const hydraPublicUrl = process.env.HYDRA_PUBLIC_URL;
      if (!hydraPublicUrl) {
        throw new Error('HYDRA_PUBLIC_URL is not defined');
      }

      const response = await axios.post(
        `${hydraPublicUrl}/oauth2/token`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const tokenData = response.data;

      return {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
      };
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 401) {
          throw new UnauthorizedException(
            data?.error_description || 'Invalid client credentials',
          );
        }

        if (status === 400) {
          throw new BadRequestException(
            data?.error_description || 'Invalid request',
          );
        }

        throw new InternalServerErrorException(
          data?.error_description || 'Failed to obtain token',
        );
      }

      throw error;
    }
  }

  /**
   * Create a new OAuth2 client
   */
  async createClient(dto: CreateOAuth2ClientDto): Promise<OAuth2Client> {
    try {
      const client: OAuth2Client = {
        client_id: dto.client_id,
        client_secret: dto.client_secret,
        client_name: dto.client_name,
        grant_types: dto.grant_types,
        response_types: dto.response_types || ['token'],
        scope: dto.scope || '',
        redirect_uris: dto.redirect_uris || [],
        token_endpoint_auth_method:
          dto.token_endpoint_auth_method || 'client_secret_basic',
        metadata: dto.metadata,
      };

      const response = await this.hydraAdminApi.createOAuth2Client({
        oAuth2Client: client,
      });

      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 400) {
          throw new BadRequestException(
            data?.error_description || 'Invalid client data',
          );
        }

        throw new InternalServerErrorException(
          data?.error_description || 'Failed to create client',
        );
      }

      throw error;
    }
  }

  /**
   * List all OAuth2 clients
   */
  async listClients(): Promise<OAuth2Client[]> {
    try {
      const response = await this.hydraAdminApi.listOAuth2Clients();
      return response.data || [];
    } catch (error) {
      if (isAxiosError(error)) {
        throw new InternalServerErrorException(
          'Failed to list OAuth2 clients',
        );
      }
      throw error;
    }
  }

  /**
   * Get OAuth2 client by ID
   */
  async getClient(clientId: string): Promise<OAuth2Client> {
    try {
      const response = await this.hydraAdminApi.getOAuth2Client({
        id: clientId,
      });
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          throw new BadRequestException('Client not found');
        }
        throw new InternalServerErrorException('Failed to get client');
      }
      throw error;
    }
  }

  /**
   * Delete OAuth2 client
   */
  async deleteClient(clientId: string): Promise<void> {
    try {
      await this.hydraAdminApi.deleteOAuth2Client({ id: clientId });
    } catch (error) {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404) {
          throw new BadRequestException('Client not found');
        }
        throw new InternalServerErrorException('Failed to delete client');
      }
      throw error;
    }
  }

  /**
   * Introspect access token
   */
  async introspectToken(token: string): Promise<IntrospectedOAuth2Token> {
    try {
      const formData = new URLSearchParams();
      formData.append('token', token);

      // Use axios to call Hydra introspection endpoint directly
      const hydraPublicUrl = process.env.HYDRA_PUBLIC_URL;
      if (!hydraPublicUrl) {
        throw new Error('HYDRA_PUBLIC_URL is not defined');
      }

      const response = await axios.post(
        `${hydraPublicUrl}/oauth2/introspect`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        throw new UnauthorizedException('Invalid or expired token');
      }
      throw error;
    }
  }

  /**
   * Get OIDC Discovery configuration
   */
  async getDiscoveryConfiguration(): Promise<any> {
    try {
      const response = await this.hydraOidcApi.discoverOidcConfiguration();
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        throw new InternalServerErrorException(
          'Failed to get discovery configuration',
        );
      }
      throw error;
    }
  }

  /**
   * Get JSON Web Key Set (JWKS)
   */
  async getJwks(): Promise<any> {
    try {
      const response = await this.hydraWellknownApi.discoverJsonWebKeys();
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        throw new InternalServerErrorException('Failed to get JWKS');
      }
      throw error;
    }
  }
}

