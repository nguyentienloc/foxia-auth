import { Transform, TransformationType } from 'class-transformer';
import { Permissions } from 'core/enums/permissions/index.enum';

export const PermissionsTransform = () =>
  Transform(({ value, type }) => {
    if (type !== TransformationType.CLASS_TO_PLAIN || !value) return value;
    const _enum = Permissions;
    const transformed = value.reduce((prev, it, idx) => {
      prev[_enum[idx]] = it;
      return prev;
    }, {});
    return transformed;
  });
