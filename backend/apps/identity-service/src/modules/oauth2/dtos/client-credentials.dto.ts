import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ClientCredentialsDto {
  @ApiProperty({
    description: 'OAuth2 grant type, must be "client_credentials"',
    example: 'client_credentials',
  })
  @IsString()
  @IsNotEmpty()
  grant_type: string;

  @ApiProperty({
    description: 'OAuth2 client ID',
    example: 'my-client-id',
  })
  @IsString()
  @IsNotEmpty()
  client_id: string;

  @ApiProperty({
    description: 'OAuth2 client secret',
    example: 'my-client-secret',
  })
  @IsString()
  @IsNotEmpty()
  client_secret: string;

  @ApiProperty({
    description: 'OAuth2 scope (optional)',
    example: 'read write',
    required: false,
  })
  @IsString()
  @IsOptional()
  scope?: string;
}

