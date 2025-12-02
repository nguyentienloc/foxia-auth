import { Transform } from 'class-transformer';

export const BooleanTransform = () =>
  Transform(({value}) => {
    if (value === 'false') return false;
    return Boolean(value);
  });
