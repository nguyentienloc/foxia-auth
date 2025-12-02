import { AreaPermission } from './area-permission.enum';
import { BrandPermission } from './brand-permission.enum';
import { ContactLevelPermission } from './contact-level-permission.enum';
import { DistributionChannelPermission } from './distribution-channel-permission.enum';
import { InventoryPermission } from './inventory-permission.enum';
import { LeadPermission } from './lead-permission.enum';
import { OrderPermission } from './order-permission.enum';
import { PartnerPermission } from './partner-permission.enum';
import { PartnerSourcePermission } from './partner-source-permission.enum';
import { PriceListPermission } from './price-list-permission.enum';
import { ProductPermission } from './product-permission.enum';
import { PromotionPermission } from './promotion-permission.enum';
import { RouterPermission } from './router-permission.enum';
import { RouteSchedulePermission } from './route-schedule-permission.enum';
import { ShowcasePermission } from './showcase-permission.enum';
import { TeamPermission } from './team-permission.enum';
import { UserPermission } from './user-permission.enum';
import { VisitFrequencyPermission } from './visit-frequency-permission.enum';

export enum Permissions {
  partner,
  lead,
  order,
  promotion,
  router,
  showcase,
  route_schedule,
  inventory,
  brand,
  product,
  price_list,
  // team,
  // user,
  // area,
  // partner_source,
  // distribution_channel,
  // visit_frequency,
  // contact_level,
}

export const ENUM_PERMISSION_MAPPING: Record<Permissions, any> = {
  [Permissions.partner]: PartnerPermission,
  [Permissions.lead]: LeadPermission,
  [Permissions.order]: OrderPermission,
  [Permissions.promotion]: PromotionPermission,
  [Permissions.router]: RouterPermission,
  [Permissions.showcase]: ShowcasePermission,
  [Permissions.inventory]: InventoryPermission,
  [Permissions.brand]: BrandPermission,
  [Permissions.product]: ProductPermission,
  [Permissions.price_list]: PriceListPermission,
  [Permissions.route_schedule]: RouteSchedulePermission,
  // [Permissions.team]: TeamPermission,
  // [Permissions.user]: UserPermission,
  // [Permissions.area]: AreaPermission,
  // [Permissions.partner_source]: PartnerSourcePermission,
  // [Permissions.distribution_channel]: DistributionChannelPermission,
  // [Permissions.visit_frequency]: VisitFrequencyPermission,
  // [Permissions.contact_level]: ContactLevelPermission,
};
