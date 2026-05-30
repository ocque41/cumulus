import type { ProductId, ProductMeta } from './types';

export const PRODUCT_ORDER: ProductId[] = ['cumulus-db'];

export const PRODUCT_META: Record<ProductId, ProductMeta> = {
  'cumulus-db': {
    id: 'cumulus-db',
    name: 'Cumulus',
    status: 'ga',
    statusLabel: { en: 'Available', es: 'Disponible' },
    primaryHref: '/dashboard',
    primaryLabel: { en: 'Build command', es: 'Crear comando' },
    secondaryHref: '/',
    secondaryLabel: { en: 'Dashboard', es: 'Dashboard' },
  },
};
