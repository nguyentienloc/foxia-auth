import "reflect-metadata";

export const VIRTUAL_SELECT_COLUMN_KEY = Symbol("VIRTUAL_SELECT_COLUMN_KEY");

export function VirtualSelectColumn(name?: string): PropertyDecorator {
  return (target, propertyKey) => {
    const metaInfo = Reflect.getMetadata(VIRTUAL_SELECT_COLUMN_KEY, target) || {};

    metaInfo[propertyKey] = name ?? propertyKey;

    Reflect.defineMetadata(VIRTUAL_SELECT_COLUMN_KEY, metaInfo, target);
  };
}
