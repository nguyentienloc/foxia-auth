import { Transform } from 'class-transformer';

export const NumberTransform = () =>
  Transform((value) => {
    if (!value) {
      return undefined;
    }
    if (Array.isArray(value)) {
      return value.map((item) => {
        return Number(item);
      });
    }
    return Number(value);
  });
