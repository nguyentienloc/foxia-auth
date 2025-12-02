import { Transform, TransformationType } from 'class-transformer';
import { $enum } from 'ts-enum-util';

export const EnumTransform = (entity: any) =>
  Transform(({ value, obj, type }) => {
    if (Array.isArray(value)) {
      return value.map((item) => {
        switch (type) {
          case TransformationType.CLASS_TO_PLAIN:
            return entity[item];
          case TransformationType.PLAIN_TO_CLASS:
            if (
              $enum(entity)
                .getKeys()
                .map((item) => `${item}`)
                .includes(item)
            ) {
              return entity[item];
            }
            return entity[entity[item]];
        }
        return item;
      });
    }
    switch (type) {
      case TransformationType.CLASS_TO_PLAIN:
        return entity[value];
      case TransformationType.PLAIN_TO_CLASS:
        if (
          $enum(entity)
            .getKeys()
            .map((item) => `${item}`)
            .includes(value)
        ) {
          return entity[value];
        }
        return entity[entity[value]];
    }
    return value;
  });
