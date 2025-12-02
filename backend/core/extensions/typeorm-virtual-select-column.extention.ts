import { SelectQueryBuilder } from 'typeorm';
import { VIRTUAL_SELECT_COLUMN_KEY } from '../decorators/virtual-select-column.decorator';
import { groupBy } from 'lodash';

declare module 'typeorm' {
  interface SelectQueryBuilder<Entity> {
    getMany(this: SelectQueryBuilder<Entity>): Promise<Entity[] | undefined>;
    getOne(this: SelectQueryBuilder<Entity>): Promise<Entity | undefined>;
  }
}

SelectQueryBuilder.prototype.getManyAndCount = async function() {
  const [data, count] = await Promise.all([
    this.getRawAndEntities(),
    this.getCount(),
  ]);
  const { entities, raw } = data;
  const primaryKeys = this.expressionMap.mainAlias.metadata.primaryColumns.map(
    i => i.propertyName,
  );
  const rawPrimaryKeys = this.expressionMap.mainAlias.metadata.primaryColumns.map(
    i => `${this.alias}_${i.databaseName}`,
  );
  const rawLookup = groupBy(
    raw.map(i => ({ ...i, _key: rawPrimaryKeys.map(k => i[k]).join('_') })),
    '_key',
  );

  const items = entities.map((entity, index) => {
    const metaInfo = Reflect.getMetadata(VIRTUAL_SELECT_COLUMN_KEY, entity) ?? {};
    // console.log('metaInfo', metaInfo);
    const key = primaryKeys.map(i => entity[i]).join('_');
    const item = rawLookup[key][0];

    for (const [propertyKey, name] of Object.entries<string>(metaInfo)) {
      entity[propertyKey] = item[name];
    }

    return entity;
  });

  return [items, count];
};

SelectQueryBuilder.prototype.getMany = async function() {
  const { entities, raw } = await this.getRawAndEntities();

  const primaryKeys = this.expressionMap.mainAlias.metadata.primaryColumns.map(
    i => i.propertyName,
  );
  const rawPrimaryKeys = this.expressionMap.mainAlias.metadata.primaryColumns.map(
    i => `${this.alias}_${i.databaseName}`,
  );
  const rawLookup = groupBy(
    raw.map(i => ({ ...i, _key: rawPrimaryKeys.map(k => i[k]).join('_') })),
    '_key',
  );

  const items = entities.map((entity, index) => {
    const metaInfo = Reflect.getMetadata(VIRTUAL_SELECT_COLUMN_KEY, entity) ?? {};
    const key = primaryKeys.map(i => entity[i]).join('_');
    const item = rawLookup && rawLookup[key] && rawLookup[key][0];

    for (const [propertyKey, name] of Object.entries<string>(metaInfo)) {
      entity[propertyKey] = item[name];
    }

    return entity;
  });

  return [...items];
};

SelectQueryBuilder.prototype.getOne = async function() {
  const { entities, raw } = await this.getRawAndEntities();
  if (!entities[0]) {
    return undefined;
  }
  const metaInfo = Reflect.getMetadata(VIRTUAL_SELECT_COLUMN_KEY, entities[0]) ?? {};

  for (const [propertyKey, name] of Object.entries<string>(metaInfo)) {
    entities[0][propertyKey] = raw[0][name];
  }

  return entities[0];
};
