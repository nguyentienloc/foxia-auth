import { Transform } from 'class-transformer';
import { isEmpty, isNil } from 'lodash';

export const NonEmptyTransform = () =>
  Transform(({value}) => {
    if (typeof value === 'string') {
      value = value.trim();
    }
    return isNil(value) || (typeof value === 'string' && isEmpty(value))
      ? undefined
      : value;
  });
