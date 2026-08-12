export type QueryBudgetClass =
  | 'dashboard'
  | 'detail'
  | 'lookup'
  | 'search'
  | 'report'
  | 'default';

export const QUERY_BUDGET_MS: Record<QueryBudgetClass, number> = {
  dashboard: 150,
  detail: 120,
  lookup: 80,
  search: 300,
  report: 1000,
  default: 200,
};

const dashboardPatterns = [
  '/dashboard',
  '/runtime/overview',
  '/runtime/operational-workflow',
];

const reportPatterns = [
  '/audit',
  '/logs',
  '/history',
  '/reports',
  '/runtime/integrity',
];

const lookupPatterns = [
  '/lookup',
  '/suggest',
  '/suggestions',
  '/categories',
  '/units',
  '/material-types',
];

const searchPatterns = ['/search', '?search=', '&search='];

const detailPatterns = [
  '/detail',
  '/materials/',
  '/projects/',
  '/components/',
  '/dispatch-orders/',
];

export function classifyQueryBudget(
  method: string,
  path: string,
): QueryBudgetClass {
  const normalized = `${path ?? ''}`.toLowerCase();

  if (dashboardPatterns.some((pattern) => normalized.includes(pattern))) {
    return 'dashboard';
  }

  if (reportPatterns.some((pattern) => normalized.includes(pattern))) {
    return 'report';
  }

  if (lookupPatterns.some((pattern) => normalized.includes(pattern))) {
    return 'lookup';
  }

  if (searchPatterns.some((pattern) => normalized.includes(pattern))) {
    return 'search';
  }

  if (
    method?.toUpperCase() === 'GET' &&
    detailPatterns.some((pattern) => normalized.includes(pattern))
  ) {
    return 'detail';
  }

  return 'default';
}
