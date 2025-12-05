export interface UserTraits {
  email: string;
  name?: {
    first: string;
    last: string;
  };
  phone?: string;
  [key: string]: unknown;
}
