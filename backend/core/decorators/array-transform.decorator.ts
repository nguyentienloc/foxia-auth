import { Transform, TransformFnParams } from 'class-transformer';
import * as _ from 'lodash';

export const ArrayTransform = (
  conditionFn?: (params: TransformFnParams) => Boolean,
) =>
  Transform((params) => {
    const { value } = params;
    if (conditionFn?.(params) === false) return value;
    return !_.isNil(value)
      ? Array.isArray(value)
        ? value
        : [value]
      : undefined;
  });
