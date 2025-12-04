import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsUrl,
  IsBoolean,
} from 'class-validator';

export class CreateOAuth2ClientDto {
  @ApiProperty({
    description: 'Client ID (optional, will be generated if not provided)',
    example: 'my-client-id',
    required: false,
  })
  @IsString()
  @IsOptional()
  client_id?: string;

  @ApiProperty({
    description: 'Client secret (optional, will be generated if not provided)',
    example: 'my-client-secret',
    required: false,
  })
  @IsString()
  @IsOptional()
  client_secret?: string;

  @ApiProperty({
    description: 'Client name',
    example: 'My Application',
  })
  @IsString()
  @IsNotEmpty()
  client_name: string;

  @ApiProperty({
    description: 'Allowed grant types',
    example: ['client_credentials'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  grant_types: string[];

  @ApiProperty({
    description: 'Allowed response types',
    example: ['token'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  response_types?: string[];

  @ApiProperty({
    description: 'Allowed scopes',
    example: ['read', 'write'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  scope?: string;

  @ApiProperty({
    description: 'Redirect URIs (for authorization code flow)',
    example: ['https://example.com/callback'],
    type: [String],
    required: false,
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  redirect_uris?: string[];

  @ApiProperty({
    description: 'Token endpoint authentication method',
    example: 'client_secret_basic',
    required: false,
  })
  @IsString()
  @IsOptional()
  token_endpoint_auth_method?: string;

  @ApiProperty({
    description: 'Client metadata (optional)',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

