export enum OrderPermission {
  create = 1 << 0,
  updateStatus = 1 << 1,
  fetchOne = 1 << 2,
  edit = 1 << 3,
  paymentConfirmation = 1 << 4,
  fetchMany = 1 << 5
}
