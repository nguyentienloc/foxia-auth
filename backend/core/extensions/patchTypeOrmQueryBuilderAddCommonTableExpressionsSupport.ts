import {
  DeleteQueryBuilder,
  InsertQueryBuilder,
  RelationQueryBuilder,
  SelectQueryBuilder,
  UpdateQueryBuilder,
} from 'typeorm';
import { QueryExpressionMap } from 'typeorm/query-builder/QueryExpressionMap';

function patchTypeOrmQueryBuilderAddCommonTableExpressionsSupport(
  queryBuilder: OptionableQueryBuilder = SelectQueryBuilder,
): void {
  const queryExpressionMap: typeof QueryExpressionMap = QueryExpressionMap;
  const queryExpressionMapPrototype = queryExpressionMap.prototype;
  const originalClone = queryExpressionMapPrototype.clone;

  const qbPrototype = queryBuilder.prototype;
  const originalGetQuery = qbPrototype.getQuery;

  Object.defineProperty(queryExpressionMapPrototype, 'clone', {
    value: function clone() {
      const context = this as QueryExpressionMap; // For typization only
      const result = originalClone.call(context);
      // result.commonTableExpressions = { ...context.commonTableExpressions };
      return result;
    },
  });

  Object.defineProperty(qbPrototype, 'getQuery', {
    value: function getQuery(): string {
      const context = this as SelectQueryBuilder<unknown>; // For typization only
      // const ctes = Object.entries(
      //   context.expressionMap.commonTableExpressions ?? {},
      // );

      // if (ctes.length && !context.expressionMap.subQuery) {
      //   return [
      //     'WITH',
      //     ctes.map(([name, expression]) => `${context.escape(name)} AS (${expression})`).join(', '),
      //     originalGetQuery.call(context),
      //   ].join(' ');
      // }

      return originalGetQuery.call(context);
    },
  });

  Object.defineProperty(qbPrototype, 'unScope', {
    value: function unScope(alias: string) {
      const _alias = this.expressionMap.findAliasByName(alias);
      if (_alias) {
        // const metadata = _alias.metadata.tableMetadataArgs as ScopedTableMetadata<unknown>;
        _alias.scopesDisabled = true;
      }
      return this;
    },
  });
}

patchTypeOrmQueryBuilderAddCommonTableExpressionsSupport();

type OptionableQueryBuilder =
  | typeof SelectQueryBuilder
  | typeof UpdateQueryBuilder
  | typeof DeleteQueryBuilder
  | typeof InsertQueryBuilder
  | typeof RelationQueryBuilder;

export interface IQueryBuilderWithCommonTableExpressions<Entity> {
  getQuery(): string;

  unScope(alias: string): this;
}

declare module 'typeorm' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface SelectQueryBuilder<Entity>
    extends IQueryBuilderWithCommonTableExpressions<Entity> {}
}
