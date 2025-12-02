import { Transform } from 'class-transformer';

export const PhoneTransform = () =>
  Transform(({value}) =>
    value?.startsWith('84') ? value?.replace('84', '0') : value,
  );
