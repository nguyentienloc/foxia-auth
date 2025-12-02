export enum RouterPermission {
  create = 1 << 0,
  fetchOne = 1 << 1,
  edit = 1 << 2,
  updateStatus = 1 << 3,
  assignRouter = 1 << 4,
  fetchMany = 1 << 5,
}
