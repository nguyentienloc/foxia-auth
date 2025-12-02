export interface RequestUser {
  id: number;
  name: string;
  email: string;
  account_id: number;
  is_admin: boolean;
  permissions?: bigint[]
}
