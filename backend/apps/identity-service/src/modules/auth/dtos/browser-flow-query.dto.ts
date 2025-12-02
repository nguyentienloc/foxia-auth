import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class BrowserFlowQueryDto {
  @IsOptional()
  @IsString()
  returnTo?: string;

  @IsOptional()
  @IsString()
  aal?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value === 'true';
    }
    return undefined;
  })
  refresh?: boolean;
}

