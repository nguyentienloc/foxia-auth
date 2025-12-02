import { IsOptional, IsString } from 'class-validator';

export class LogoutFlowQueryDto {
  @IsOptional()
  @IsString()
  returnTo?: string;
}

