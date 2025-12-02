import { RequestUser } from 'core/interfaces/request-user.interface';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { TableMetadataArgs } from 'typeorm/metadata-args/TableMetadataArgs';
import { getRequestContext } from '../hooks/request-context.hook';

const GET_QUERY_COPY = '___scope_getQuery_copy___';
const GET_PARAMS_COPY = '___scope_getPARAMS_copy___';

class SelectQB<
  Entity extends ObjectLiteral,
> extends SelectQueryBuilder<Entity> {
  getQuery(): string {
    this.___patchScopes___();
    return this[GET_QUERY_COPY]();
  }

  getParameters(): ObjectLiteral {
    this.___patchScopes___();
    return super[GET_PARAMS_COPY]();
  }

  protected ___patchScopes___(): void {
    for (const table of this.expressionMap.aliases) {
      if (!table || !table.hasMetadata) continue;
      const context = getRequestContext();
      if (!context) continue;
      const metadata = table.metadata
        .tableMetadataArgs as ScopedTableMetadata<Entity>;
      const scopesDisabled = (table as any).scopesDisabled;
      if (metadata.scopes && !scopesDisabled) {
        for (const scope of metadata.scopes)
          scope(
            this,
            table.name,
            context.data.req.user,
            context.data.req.headers,
            context.data.req.query,
          );
        (table as any).scopesDisabled = true;
      }
    }
  }
}

SelectQueryBuilder.prototype[GET_QUERY_COPY] =
  SelectQueryBuilder.prototype.getQuery;
SelectQueryBuilder.prototype[GET_PARAMS_COPY] =
  SelectQueryBuilder.prototype.getParameters;
for (const property of Object.getOwnPropertyNames(SelectQB.prototype)) {
  Object.defineProperty(
    SelectQueryBuilder.prototype,
    property,
    Object.getOwnPropertyDescriptor(
      SelectQB.prototype,
      property,
    ) as PropertyDescriptor,
  );
}

export type ScopeQB<Entity> = (
  qb: SelectQueryBuilder<Entity>,
  alias: string,
  user?: RequestUser,
  headers?: Record<string, string>,
  queryParams?: Record<string, any>,
) => SelectQueryBuilder<Entity>;

export interface ScopedTableMetadata<Entity> extends TableMetadataArgs {
  scopes: Array<ScopeQB<Entity>>;
  scopesEnabled: boolean;
}
