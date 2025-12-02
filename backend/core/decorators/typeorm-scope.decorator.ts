import {
  ScopedTableMetadata,
  ScopeQB,
} from 'core/extensions/typeorm-scope.extention';
import { Connection, getMetadataArgsStorage, ObjectType } from 'typeorm';

export function Scope<Entity>(scopes: Array<ScopeQB<Entity>>, enabled = true) {
  return function (target) {
    const table = getMetadataArgsStorage().tables.find(
      (table) => table.target === target,
    ) as ScopedTableMetadata<Entity> | undefined;
    if (table) {
      table.scopes = scopes;
      // table.scopesEnabled = enabled;
    } else {
      throw new Error(
        'Could not find current entity in metadata store, maybe put @Scope() before @Entity()?',
      );
    }
  };
}

export function unscoped<Entity>(
  connection: Connection,
  target: ObjectType<Entity>,
) {
  const metadata = connection.getMetadata(target)
    .tableMetadataArgs as ScopedTableMetadata<Entity>;
  metadata.scopesEnabled = false;
  return target;
}
