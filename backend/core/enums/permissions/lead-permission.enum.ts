export enum LeadPermission {
  fetchOne = 1 << 0,
  edit = 1 << 1,
  manualAssignToSale = 1 << 2,
  manualAssignToTelesales = 1 << 3,
  fetchMany = 1 << 4,
}
