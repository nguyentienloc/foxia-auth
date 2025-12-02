import { Transform, TransformationType } from 'class-transformer';
import * as moment from 'moment-timezone';

// export const DateTransform = (skipUnknown = true) =>
//   Transform(({ value, type }) => {
//     switch (type) {
//       case TransformationType.CLASS_TO_PLAIN: {
//         if (value instanceof Date) return value.getTime();
//         const isNumber = `${value}` === `${Number(value)}`;
//         const date = new Date(isNumber ? Number(value) : value);
//         if (!isNaN(date.getTime())) return date.getTime();
//         return skipUnknown ? undefined : value;
//       }
//       case TransformationType.PLAIN_TO_CLASS: {
//         const isNumber = `${value}` === `${Number(value)}`;
//         return value
//           ? new Date(isNumber ? Number(value) : value)
//           : skipUnknown
//             ? undefined
//             : value;
//       }
//       default:
//         return value;
//     }
//   });

export const DateTransform = () =>
  Transform(({ value, type }) => {
    switch (type) {
      // Chuyển từ class ra plain object (để xuất JSON)
      case TransformationType.CLASS_TO_PLAIN:
        return value instanceof Date ? value.getTime() : undefined;

      // Chuyển từ plain object vào class (khi nhận dữ liệu từ request)
      case TransformationType.PLAIN_TO_CLASS:
        if (!value) return undefined;

        // Xử lý khi giá trị là timestamp (dạng mili giây)
        if (!isNaN(Number(value))) {
          const timestamp = Number(value);
          const dateFromTimestamp = new Date(timestamp);
          if (!isNaN(dateFromTimestamp.getTime())) {
            return dateFromTimestamp;
          }
        }

        // Xử lý khi giá trị là chuỗi thời gian theo định dạng ISO 8601
        const dateFromDatetime = moment(value, moment.ISO_8601, true).toDate();
        if (moment(dateFromDatetime).isValid()) {
          return dateFromDatetime;
        }

        return undefined;

      // Giữ nguyên giá trị cho các kiểu chuyển đổi khác
      default:
        return value;
    }
  });

export const DateTransformISO = (skipUnknown = true) =>
  Transform(({ value, type }) => {
    switch (type) {
      case TransformationType.CLASS_TO_PLAIN:
        return typeof value === 'string'
          ? moment(value).format('YYYY-MM-DD')
          : skipUnknown
            ? undefined
            : value;
      case TransformationType.PLAIN_TO_CLASS:
        const isNumber = `${value}` === `${Number(value)}`;
        return value
          ? new Date(isNumber ? Number(value) : value)
          : skipUnknown
            ? undefined
            : value;
      default:
        return value;
    }
  });
