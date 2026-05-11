import type { ProductId, ProductMeta } from './types';

export const PRODUCT_ORDER: ProductId[] = ['tado', 'relay'];

export const PRODUCT_META: Record<ProductId, ProductMeta> = {
  tado: {
    id: 'tado',
    name: 'Tado',
    licenseLabel: { en: 'MIT', es: 'MIT' },
    status: 'ga',
    statusLabel: { en: 'Available', es: 'Disponible' },
    primaryHref: 'https://github.com/cumulus/tado/releases',
    primaryLabel: { en: 'Download', es: 'Descargar' },
    secondaryHref: 'https://github.com/cumulus/tado',
    secondaryLabel: { en: 'View source', es: 'Ver código' },
  },
  relay: {
    id: 'relay',
    name: 'Relay',
    licenseLabel: { en: 'Proprietary', es: 'Propietario' },
    status: 'beta',
    statusLabel: { en: 'Beta', es: 'Beta' },
    primaryHref: 'https://relay.cumulush.com',
    primaryLabel: { en: 'Start', es: 'Empezar' },
    secondaryHref: 'https://relay.cumulush.com/docs',
    secondaryLabel: { en: 'Read docs', es: 'Leer docs' },
  },
};
