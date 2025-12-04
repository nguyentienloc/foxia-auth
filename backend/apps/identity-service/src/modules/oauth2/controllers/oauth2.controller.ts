import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { OAuth2Service } from '../services/oauth2.service';
import { ClientCredentialsDto } from '../dtos/client-credentials.dto';
import { CreateOAuth2ClientDto } from '../dtos/create-client.dto';
import { TokenResponseDto } from '../dtos/token-response.dto';

@Controller('oauth2')
@ApiTags('oauth2')
export class OAuth2Controller {
  constructor(private readonly oauth2Service: OAuth2Service) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'OAuth2 Token endpoint (Client Credentials Flow)' })
  @ApiResponse({
    status: 200,
    description: 'Token issued successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Invalid client credentials' })
  async token(@Body() dto: ClientCredentialsDto): Promise<TokenResponseDto> {
    return this.oauth2Service.handleClientCredentialsFlow(dto);
  }

  @Get('.well-known/openid-configuration')
  @ApiOperation({ summary: 'OIDC Discovery endpoint' })
  @ApiResponse({
    status: 200,
    description: 'OpenID Connect discovery configuration',
  })
  async getDiscoveryConfiguration(): Promise<any> {
    return this.oauth2Service.getDiscoveryConfiguration();
  }

  @Get('jwks')
  @ApiOperation({ summary: 'JSON Web Key Set (JWKS) endpoint' })
  @ApiResponse({
    status: 200,
    description: 'JSON Web Key Set',
  })
  async getJwks(): Promise<any> {
    return this.oauth2Service.getJwks();
  }

  @Post('clients')
  @ApiOperation({ summary: 'Create a new OAuth2 client (Admin)' })
  @ApiResponse({
    status: 201,
    description: 'OAuth2 client created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid client data' })
  async createClient(@Body() dto: CreateOAuth2ClientDto): Promise<any> {
    return this.oauth2Service.createClient(dto);
  }

  @Get('clients')
  @ApiOperation({ summary: 'List all OAuth2 clients (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'List of OAuth2 clients',
    type: [Object],
  })
  async listClients(): Promise<any[]> {
    return this.oauth2Service.listClients();
  }

  @Get('clients/:id')
  @ApiOperation({ summary: 'Get OAuth2 client by ID (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'OAuth2 client details',
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async getClient(@Param('id') id: string): Promise<any> {
    return this.oauth2Service.getClient(id);
  }

  @Delete('clients/:id')
  @ApiOperation({ summary: 'Delete OAuth2 client (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'OAuth2 client deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Client not found' })
  async deleteClient(@Param('id') id: string): Promise<{ success: boolean }> {
    await this.oauth2Service.deleteClient(id);
    return { success: true };
  }
}

