import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { ArrayTransform } from 'core/decorators/array-transform.decorator';
import { BooleanTransform } from 'core/decorators/boolean-transform.decorator';
import { AdvancedFilter } from './advanced.filter';
import Sort from 'core/enums/sort.enum';

export abstract class BaseListFilter {
  @ApiProperty({ required: false })
  @IsOptional()
  query?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @ArrayTransform()
  ids?: number[];

  @ApiProperty({ required: false })
  @IsOptional()
  @BooleanTransform()
  get_all_names?: boolean;

  @IsOptional()
  @ApiProperty({ required: false, isArray: true, type: AdvancedFilter })
  @ValidateNested({ each: true })
  @Type(() => AdvancedFilter)
  @IsArray()
  advanced_filters?: AdvancedFilter[] = [];

  @ApiProperty({ required: false })
  @IsOptional()
  order_by?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  sort?: Sort;
}
