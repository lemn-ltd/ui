export const monthlyReportData = [
  { month: 'Jan', revenue: 42, expenses: 28, conversion: 31 },
  { month: 'Feb', revenue: 48, expenses: 30, conversion: 35 },
  { month: 'Mar', revenue: 45, expenses: 33, conversion: 34 },
  { month: 'Apr', revenue: 58, expenses: 36, conversion: 41 },
  { month: 'May', revenue: 64, expenses: 39, conversion: 46 },
  { month: 'Jun', revenue: 72, expenses: 43, conversion: 52 },
] as const;

export const trafficSources = [
  { label: 'Direct', value: 42 },
  { label: 'Search', value: 31 },
  { label: 'Referrals', value: 18 },
  { label: 'Campaigns', value: 9 },
] as const;

export const reportCategories = [
  { label: 'Workspace', value: 84 },
  { label: 'Reports', value: 63 },
  { label: 'Automations', value: 47 },
  { label: 'Settings', value: 28 },
] as const;

export const runStates = [
  { label: 'Queued', status: 'complete' },
  { label: 'Prepared', status: 'complete' },
  { description: 'Executing the approved plan.', label: 'Running', status: 'active' },
  { label: 'Review', status: 'pending' },
  { label: 'Complete', status: 'pending' },
] as const;
