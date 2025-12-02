import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutFlowDto {
  @IsString()
  @IsNotEmpty()
  logout_token: string;
}

