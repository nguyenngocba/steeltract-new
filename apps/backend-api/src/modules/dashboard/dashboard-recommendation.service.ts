import { Injectable } from '@nestjs/common';

type RecommendedAction = {
  id: string;
  priority: 'critical' | 'warning' | 'information';
  module: string;
  actionType: string;
  title: string;
  description: string;
  entityCode: string | null;
  suggestedAction: string;
};

@Injectable()
export class DashboardRecommendationService {
  getRecommendations(trends: any, insights: any, notifications: any) {
    const actions: RecommendedAction[] = [];

    for (const row of trends?.materialShortageForecast ?? []) {
      if (row.daysUntilStockout !== null && row.daysUntilStockout <= 7) {
        actions.push({
          id: `action-replenish-${row.inventoryItemId}`,
          priority: 'critical',
          module: 'Inventory',
          actionType: 'Nhập vật tư',
          title: `Nhập thêm ${row.materialCode}`,
          description:
            `Dự kiến hết sau ${row.daysUntilStockout} ngày; khuyến nghị nhập ${row.recommendedReorderQty} ${row.unit ?? ''}`.trim(),
          entityCode: row.materialCode,
          suggestedAction: 'Tạo yêu cầu mua/nhập kho',
        });
      }
    }

    for (const risk of trends?.productionStopRisks ?? []) {
      actions.push({
        id: `action-production-${risk.productionOrderId}`,
        priority: risk.severity === 'critical' ? 'critical' : 'warning',
        module: 'Production',
        actionType: 'Ưu tiên cấp vật tư',
        title: `Cấp vật tư cho ${risk.productionOrderNo}`,
        description: `${risk.missingMaterials?.length ?? 0} vật tư thiếu có thể làm chậm lệnh sản xuất.`,
        entityCode: risk.productionOrderNo,
        suggestedAction: 'Rà soát reservation/issue và ưu tiên cấp phát',
      });
    }

    const yard = insights?.health?.modules?.find(
      (module: any) => module.module === 'Yard',
    );
    if ((yard?.metrics?.occupancy ?? 0) >= 90) {
      actions.push({
        id: 'action-yard-rebalance',
        priority: (yard.metrics.occupancy ?? 0) >= 100 ? 'critical' : 'warning',
        module: 'Yard',
        actionType: 'Điều phối lại vị trí',
        title: 'Giảm tải bãi tập kết',
        description: `Sức chứa bãi đang ở ${(yard.metrics.occupancy ?? 0).toFixed(1)}%.`,
        entityCode: null,
        suggestedAction: 'Chuyển vị trí hoặc ưu tiên xuất bãi',
      });
    }

    const qc = insights?.health?.modules?.find(
      (module: any) => module.module === 'QC',
    );
    if ((qc?.metrics?.openNcr ?? 0) > 0) {
      actions.push({
        id: 'action-qc-ncr',
        priority: 'critical',
        module: 'QC',
        actionType: 'Xử lý NCR',
        title: 'Xử lý NCR đang mở',
        description: `${qc.metrics.openNcr} NCR cần được xử lý để tránh nghẽn giao hàng/sản xuất.`,
        entityCode: null,
        suggestedAction: 'Ưu tiên phân công inspector/owner xử lý NCR',
      });
    }

    const projects = insights?.health?.modules?.find(
      (module: any) => module.module === 'Projects',
    );
    if ((projects?.metrics?.delayedProjects ?? 0) > 0) {
      actions.push({
        id: 'action-project-progress',
        priority: 'warning',
        module: 'Projects',
        actionType: 'Rà soát tiến độ',
        title: 'Rà soát công trình chậm',
        description: `${projects.metrics.delayedProjects} công trình đang ở trạng thái chậm tiến độ.`,
        entityCode: null,
        suggestedAction:
          'Kiểm tra kế hoạch, cấu kiện, vật tư và vận chuyển liên quan',
      });
    }

    for (const notice of notifications?.items ?? []) {
      if (notice.priority !== 'Information' && actions.length < 12) {
        actions.push({
          id: `action-notification-${notice.id}`,
          priority: notice.priority === 'Critical' ? 'critical' : 'warning',
          module: notice.module,
          actionType: notice.actionLabel ?? 'Theo dõi',
          title: notice.title,
          description: notice.description,
          entityCode: notice.entityCode,
          suggestedAction: notice.actionLabel ?? 'Kiểm tra chi tiết',
        });
      }
    }

    return {
      title: 'Khuyến nghị hôm nay',
      items: dedupe(actions)
        .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority))
        .slice(0, 12),
    };
  }
}

function priorityRank(priority: RecommendedAction['priority']) {
  if (priority === 'critical') return 0;
  if (priority === 'warning') return 1;
  return 2;
}

function dedupe(rows: RecommendedAction[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.module}:${row.actionType}:${row.entityCode ?? row.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
