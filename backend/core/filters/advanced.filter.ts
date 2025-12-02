import { IsNotEmpty, ValidateIf } from 'class-validator';
import { IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { AdvancedFilterOperator } from 'core/enums/advanced-filter.enum';

export class FilterDto {
  @ApiProperty({
    enum: AdvancedFilterOperator,
  })
  @IsNotEmpty()
  operator: AdvancedFilterOperator;

  @ApiProperty()
  @IsNotEmpty()
  @IsArray()
  properties: string[];

  @ApiProperty()
  @ValidateIf(
    (o) =>
      ![
        AdvancedFilterOperator.IS_NULL,
        AdvancedFilterOperator.IS_NOT_NULL,
      ].includes(o.operator),
  )
  @IsNotEmpty()
  value: any;
}

export class AdvancedFilter {
  @ApiProperty({ required: false, isArray: true, type: FilterDto })
  @ValidateNested({ each: true })
  @Type(() => FilterDto)
  @IsArray()
  @IsNotEmpty()
  filters: FilterDto[];
}
