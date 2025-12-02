export default class StringUtils {
  public static generateOtp = (maxLength = 6) => {
    const string = '0123456789';
    let OTP = '';

    // Find the length of string
    const len = string.length;
    for (let i = 0; i < maxLength; i++) {
      OTP += string[Math.floor(Math.random() * len)];
    }
    return OTP;
  };

  public static getString = (o: unknown) => {
    if (o !== null) {
      if (typeof o === 'string') {
        return o;
      } else {
        try {
          return JSON.stringify(o);
        } catch (e) {
          return '';
        }
      }
    } else {
      return null;
    }
  };

  public static replaceByAsterisks = (
    str: string,
    from = 0,
    to = 4,
  ): string => {
    if (!str || typeof str !== 'string') return str;
    const length = str.length;
    const firstPart = str.substring(0, from);
    const secondPart = str.substring(length - to);
    const middlePart = '*'.repeat(
      length - firstPart.length - secondPart.length,
    );

    return firstPart + middlePart + secondPart;
  };
}
