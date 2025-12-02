export class RawResponse<T> {
  constructor(data: T) {
    this.data = data;
  }

  data: T;
}
