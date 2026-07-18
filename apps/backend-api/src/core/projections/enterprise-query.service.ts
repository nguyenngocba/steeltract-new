import { Injectable, NotFoundException } from '@nestjs/common';

import { ProjectionQueryService } from './projection-query.service';
import {
  EnterpriseProjectionName,
  ProjectionListQuery,
} from './projection.types';

const enterpriseModuleViews = {
  inventory: {
    materials: 'MaterialAvailability',
    locations: 'LocationBalance',
    movements: 'StockMovementSummary',
    reservations: 'ReservationProjection',
  },
  components: {
    components: 'ComponentSummary',
    releasedRevision: 'CurrentReleasedRevision',
    revisionHistory: 'RevisionHistory',
    engineeringBom: 'EngineeringBOMView',
    releaseTimeline: 'ReleaseTimeline',
    releasedCatalog: 'ReleasedComponentCatalog',
    usage: 'ComponentUsage',
  },
  production: {
    orders: 'ProductionOrderSummary',
    workOrders: 'WorkOrderSummary',
    timeline: 'ProductionTimeline',
    execution: 'ProductionExecution',
    dashboard: 'ProductionDashboard',
    operatorQueue: 'OperatorWorkQueue',
    materialStatus: 'ProductionMaterialStatus',
    inventoryComparison: 'ProductionVsInventory',
    openReservations: 'OpenReservations',
  },
  qc: {
    inspections: 'QcInspectionSummary',
    ncr: 'QcNcrSummary',
    timeline: 'QcTimeline',
  },
  yard: {
    items: 'YardItemSummary',
    movements: 'YardMovementTimeline',
    loading: 'YardLoadingSummary',
  },
  logistics: {
    shipments: 'ShipmentSummary',
    timeline: 'ShipmentTimeline',
  },
  projects: {
    materialAllocations: 'ProjectMaterialAllocation',
    acceptances: 'ProjectAcceptanceSummary',
    timeline: 'ProjectTimeline',
  },
} as const satisfies Record<string, Record<string, EnterpriseProjectionName>>;

export type EnterpriseQueryModule = keyof typeof enterpriseModuleViews;

@Injectable()
export class EnterpriseQueryService {
  constructor(private readonly projections: ProjectionQueryService) {}

  catalog() {
    return Object.entries(enterpriseModuleViews).map(([module, views]) => ({
      module,
      views: Object.entries(views).map(([view, projectionName]) => ({
        view,
        projectionName,
      })),
    }));
  }

  module(moduleName: string) {
    const views = this.views(moduleName);
    return {
      module: moduleName,
      views: Object.entries(views).map(([view, projectionName]) => ({
        view,
        projectionName,
      })),
    };
  }

  async list(moduleName: string, viewName: string, query: ProjectionListQuery) {
    const projectionName = this.projection(moduleName, viewName);
    const result = await this.projections.list(projectionName, query);
    return { module: moduleName, view: viewName, projectionName, ...result };
  }

  async find(moduleName: string, viewName: string, entityKey: string) {
    const projectionName = this.projection(moduleName, viewName);
    const item = await this.projections.find(projectionName, entityKey);
    return { module: moduleName, view: viewName, projectionName, item };
  }

  private projection(moduleName: string, viewName: string) {
    const views = this.views(moduleName);
    const projectionName = views[viewName];
    if (!projectionName) {
      throw new NotFoundException(
        `Enterprise query view ${moduleName}/${viewName} not found`,
      );
    }
    return projectionName;
  }

  private views(moduleName: string): Record<string, EnterpriseProjectionName> {
    const views = enterpriseModuleViews[moduleName as EnterpriseQueryModule];
    if (!views) {
      throw new NotFoundException(
        `Enterprise query module ${moduleName} not found`,
      );
    }
    return views;
  }
}
