import { IsNotEmpty, IsString } from 'class-validator';

export class FlowQueryDto {
  @IsString()
  @IsNotEmpty()
  flow: string;
}

