import { Transform } from 'class-transformer';

export const NonSpecialCharactersTransform = (excepts: string[] = []) =>
  Transform(({value}) => {
    if (!value && typeof value !== 'string') return value;

    value = value.trim();
    const regex = new RegExp(`[^\\w\\s${excepts.join('')}]`, 'gi');
    return value.replace(regex, '')
  });
