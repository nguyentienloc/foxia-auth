export enum PromotionPermission {
  create = 1 << 0,
  fetchOne = 1 << 1,
  edit = 1 << 2,
  updateStatus = 1 << 3,
  fetchMany = 1 << 4,
}
