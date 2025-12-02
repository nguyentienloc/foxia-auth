import { AdvancedFilterOperator } from 'core/enums/advanced-filter.enum';
import { Brackets, SelectQueryBuilder, WhereExpressionBuilder } from 'typeorm';
import { AdvancedFilter, FilterDto } from 'core/filters/advanced.filter';

export function applyAdvancedFiltersQueryBuilder<T>(
  queryBuilder: SelectQueryBuilder<T>,
  advancedFilters: AdvancedFilter[],
  properties?: any[],
) {
  const alias = queryBuilder.expressionMap.mainAlias.name;
  //Apply Join
  advancedFilters.forEach((filterGroup, indexGroup: number) => {
    if (filterGroup.filters?.length > 0)
      filterGroup.filters.forEach((filter: any, indexFilter: number) => {
        if (
          properties
            ?.map((property) => property?.alias)
            ?.includes(filter.properties[0])
        ) {
          const relationsAlias = `properties_${filter.properties[0]}_${indexGroup}_${indexFilter}`;
          const relations = `${alias}.properties`;
          queryBuilder.leftJoin(`${relations}`, relationsAlias);
        } else if (filter?.properties?.length > 1) {
          const relationsColumns = filter.properties.slice(
            0,
            filter.properties.length - 1,
          );
          const relationsItem = [];
          let relationsParent = alias;
          relationsColumns?.map((relationsColumnsItem, indexRelations) => {
            relationsItem.push(relationsColumnsItem);
            // const relationsAlias = `${relationsItem.join("_")}_${indexGroup}_${indexFilter}`
            const relationsAlias = relationsColumnsItem;
            const relations = `${relationsParent}.${relationsColumnsItem}`;
            const isAliasAlreadyJoined =
              queryBuilder.expressionMap.joinAttributes.some(
                (join) => join.alias?.name === relationsAlias,
              );
            if (!isAliasAlreadyJoined) {
              queryBuilder.leftJoin(`${relations}`, relationsAlias);
              queryBuilder.unScope(relationsAlias);
            }
            relationsParent = relationsAlias;
          });
        }
      });
  });

  //Apply Conditions
  return queryBuilder.andWhere(
    new Brackets((orWhereQb) => {
      advancedFilters.forEach((filterGroup, indexGroup: number) => {
        if (filterGroup.filters?.length > 0)
          orWhereQb.orWhere(
            new Brackets((andWhereQb) => {
              filterGroup.filters.forEach(
                (filter: any, indexFilter: number) => {
                  if (
                    properties
                      ?.map((property) => property?.alias)
                      ?.includes(filter.properties[0])
                  ) {
                    //Apply properties
                    const propertyInfo = properties?.find(
                      (property) => property?.alias === filter.properties[0],
                    );
                    const relationsAlias = `properties_${filter.properties[0]}_${indexGroup}_${indexFilter}`;
                    andWhereQb.andWhere(
                      new Brackets((qb) => {
                        buildFindOperatorQueryBuilder(
                          relationsAlias,
                          qb,
                          {
                            properties: ['properties', 'property_id'],
                            operator: AdvancedFilterOperator.EQUAL_TO,
                            value: propertyInfo?.id,
                          },
                          `_${indexGroup}_${indexFilter}`,
                        );
                        buildFindOperatorQueryBuilder(
                          relationsAlias,
                          qb,
                          {
                            properties: ['properties', 'property_value'],
                            operator: filter?.operator,
                            value: filter?.value,
                          },
                          `_${indexGroup}_${indexFilter}`,
                        );
                      }),
                    );
                  } else if (filter?.properties?.length > 1) {
                    //Apply relations
                    const relationsColumns = filter.properties.slice(
                      0,
                      filter.properties.length - 1,
                    );
                    // const relationsAlias = `${relationsColumns.join("_")}_${indexGroup}_${indexFilter}`
                    const relationsAlias =
                      relationsColumns[relationsColumns.length - 1];
                    buildFindOperatorQueryBuilder(
                      relationsAlias,
                      andWhereQb,
                      filter,
                      `_${indexGroup}_${indexFilter}`,
                    );
                  } else {
                    //Apply column
                    buildFindOperatorQueryBuilder(
                      alias,
                      andWhereQb,
                      filter,
                      `_${indexGroup}_${indexFilter}`,
                    );
                  }
                },
              );
            }),
          );
      });
    }),
  );
}
export function buildFindOperatorQueryBuilder(
  alias: string,
  queryBuilder: WhereExpressionBuilder,
  filter: FilterDto,
  aliasValuePrefix: string | null = null,
) {
  const property = filter.properties?.[filter.properties.length - 1];
  const aliasValue = `${filter.properties.join('_')}${aliasValuePrefix ? aliasValuePrefix : ''}`;
  const operator = filter.operator;
  const value = filter.value;
  const values = Array.isArray(value)
    ? value
    : String(value)
        .replace(' AND ', ',')
        .replace(' and ', ',')
        ?.split(',')
        ?.map((id) => id) || [];
  const [min, max] = values;

  switch (operator) {
    case AdvancedFilterOperator.EQUAL_TO:
      queryBuilder.andWhere(`${alias}.${property} = :${aliasValue}`, {
        [aliasValue]: value,
      });
      break;

    case AdvancedFilterOperator.NOT_EQUAL_TO:
      queryBuilder.andWhere(
        `(${alias}.${property} != :${aliasValue} OR ${alias}.${property} IS NULL)`,
        {
          [aliasValue]: value,
        },
      );
      break;

    case AdvancedFilterOperator.CONTAIN:
      queryBuilder.andWhere(`${alias}.${property} ILIKE :${aliasValue}`, {
        [aliasValue]: `%${value}%`,
      });
      break;

    case AdvancedFilterOperator.CONTAIN_START:
      queryBuilder.andWhere(`${alias}.${property} ILIKE :${aliasValue}`, {
        [aliasValue]: `${value}%`,
      });
      break;

    case AdvancedFilterOperator.CONTAIN_END:
      queryBuilder.andWhere(`${alias}.${property} ILIKE :${aliasValue}`, {
        [aliasValue]: `%${value}`,
      });
      break;

    case AdvancedFilterOperator.NOT_CONTAIN:
      queryBuilder.andWhere(`${alias}.${property} NOT ILIKE :${aliasValue}`, {
        [aliasValue]: `%${value}%`,
      });
      break;

    case AdvancedFilterOperator.NOT_CONTAIN_START:
      queryBuilder.andWhere(`${alias}.${property} NOT ILIKE :${aliasValue}`, {
        [aliasValue]: `${value}%`,
      });
      break;

    case AdvancedFilterOperator.NOT_CONTAIN_END:
      queryBuilder.andWhere(`${alias}.${property} NOT ILIKE :${aliasValue}`, {
        [aliasValue]: `%${value}`,
      });
      break;

    case AdvancedFilterOperator.IS_BIGGER_THAN:
      queryBuilder.andWhere(`${alias}.${property} > :${aliasValue}`, {
        [aliasValue]: value,
      });
      break;

    case AdvancedFilterOperator.IS_BIGGER_THAN_EQUAL_TO:
      queryBuilder.andWhere(`${alias}.${property} >= :${aliasValue}`, {
        [aliasValue]: value,
      });
      break;

    case AdvancedFilterOperator.IS_SMALLER_THAN:
      queryBuilder.andWhere(`${alias}.${property} < :${aliasValue}`, {
        [aliasValue]: value,
      });
      break;

    case AdvancedFilterOperator.IS_SMALLER_THAN_EQUAL_TO:
      queryBuilder.andWhere(`${alias}.${property} <= :${aliasValue}`, {
        [aliasValue]: value,
      });
      break;

    case AdvancedFilterOperator.BETWEEN:
      if (min && max) {
        queryBuilder.andWhere(
          `${alias}.${property} BETWEEN :start_${aliasValue} AND :end_${aliasValue}`,
          {
            [`start_${aliasValue}`]: min,
            [`end_${aliasValue}`]: max,
          },
        );
      }
      break;

    case AdvancedFilterOperator.NOT_BETWEEN:
      if (min && max) {
        queryBuilder.andWhere(
          `${alias}.${property} NOT BETWEEN :start_${aliasValue} AND :end_${aliasValue}`,
          {
            [`start_${aliasValue}`]: min,
            [`end_${aliasValue}`]: max,
          },
        );
      }
      break;

    case AdvancedFilterOperator.DATETIME_BETWEEN:
      if (min && max) {
        queryBuilder.andWhere(
          `${alias}.${property} BETWEEN :start_${aliasValue} AND :end_${aliasValue}`,
          {
            [`start_${aliasValue}`]: new Date(Number(min)),
            [`end_${aliasValue}`]: new Date(Number(max)),
          },
        );
      }
      break;

    case AdvancedFilterOperator.DATETIME_NOT_BETWEEN:
      if (min && max) {
        queryBuilder.andWhere(
          `${alias}.${property} NOT BETWEEN :start_${aliasValue} AND :end_${aliasValue}`,
          {
            [`start_${aliasValue}`]: new Date(Number(min)),
            [`end_${aliasValue}`]: new Date(Number(max)),
          },
        );
      }
      break;

    case AdvancedFilterOperator.IN:
      if (values?.length > 0)
        queryBuilder.andWhere(`${alias}.${property} IN (:...${aliasValue})`, {
          [aliasValue]: values,
        });
      break;

    case AdvancedFilterOperator.NOT_IN:
      if (values?.length > 0)
        queryBuilder.andWhere(
          `${alias}.${property} NOT IN (:...${aliasValue})`,
          {
            [aliasValue]: values,
          },
        );
      break;

    case AdvancedFilterOperator.IS_NULL:
      queryBuilder.andWhere(`${alias}.${property} IS NULL`);
      break;

    case AdvancedFilterOperator.IS_NOT_NULL:
      queryBuilder.andWhere(`${alias}.${property} IS NOT NULL`);
      break;

    case AdvancedFilterOperator.IN_ANY:
      queryBuilder.andWhere(
        `
        ${alias}.${property} IS NOT NULL 
        AND ${alias}.${property} <> '{}' AND
        ${alias}.${property} && :${aliasValue}
        `,
        {
          [aliasValue]: values,
        },
      );
      break;

    case AdvancedFilterOperator.NOT_IN_ANY:
      queryBuilder.andWhere(
        `
        ${alias}.${property} IS NOT NULL 
        AND ${alias}.${property} <> '{}' AND
        NOT (${alias}.${property} && :${aliasValue})
        `,
        {
          [aliasValue]: values,
        },
      );
      break;

    case AdvancedFilterOperator.EQUAL_TO_ARRAY:
      queryBuilder.andWhere(`${alias}.${property} = :${aliasValue}::jsonb`, {
        [aliasValue]: JSON.stringify(value),
      });
      break;

    case AdvancedFilterOperator.NOT_EQUAL_TO_ARRAY:
      queryBuilder.andWhere(`${alias}.${property} != :${aliasValue}::jsonb`, {
        [aliasValue]: JSON.stringify(value),
      });
      break;
    case AdvancedFilterOperator.MPATH_IN:
      if (values?.length > 0)
        queryBuilder.andWhere(
          new Brackets((sqb) => {
            // sqb.orWhere(`${alias}.${property} IN (:...values_${aliasValue})`, {
            //   [`values_${aliasValue}`]: values,
            // })
            values?.map((value) => {
              sqb
                .orWhere(`${alias}.${property} LIKE :value_${aliasValue}`, {
                  [`value_${aliasValue}`]: `${value}.%`,
                })
                .orWhere(`${alias}.${property} LIKE :value_dot_${aliasValue}`, {
                  [`value_dot_${aliasValue}`]: `%.${value}.%`,
                });
            });
          }),
        );
      break;

    default:
      throw new Error(`Unknown operator: ${operator}`);
  }
  return queryBuilder;
}
