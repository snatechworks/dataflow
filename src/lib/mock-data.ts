import type { Pipeline } from './types';

export const mockPipelines: Pipeline[] = [
  {
    id: 'pipe_1',
    name: 'Customer Orders API',
    sourceType: 'HTTP',
    status: 'RUNNING',
    createdAt: '2023-10-26T10:00:00Z',
    esIndex: 'customer_orders_v3',
  },
  {
    id: 'pipe_2',
    name: 'Product Catalog FTP',
    sourceType: 'FILE',
    status: 'STOPPED',
    createdAt: '2023-10-25T14:30:00Z',
    esIndex: 'product_catalog_live',
  },
  {
    id: 'pipe_3',
    name: 'User Events Stream',
    sourceType: 'DATABASE',
    status: 'ERROR',
    createdAt: '2023-10-24T09:15:00Z',
    esIndex: 'user_events_prod',
  },
  {
    id: 'pipe_4',
    name: 'Website Analytics',
    sourceType: 'HTTP',
    status: 'IDLE',
    createdAt: '2023-10-22T18:45:00Z',
    esIndex: 'website_analytics_2024',
  },
  {
    id: 'pipe_5',
    name: 'Inventory DB Sync',
    sourceType: 'DATABASE',
    status: 'RUNNING',
    createdAt: '2023-10-27T11:00:00Z',
    esIndex: 'inventory_master',
  },
];
