import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { isNil, isNumber } from 'lodash';

export function IsTimestamp(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isTimestamp',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return (
            !isNil(value) && new Date(value).getTime() > 0
          );
        },
        defaultMessage: (args: ValidationArguments) =>
          args.property + ' is not valid, the value must be a timestamp',
      },
    });
  };
}
