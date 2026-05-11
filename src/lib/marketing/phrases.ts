import type { LocalizedText } from './schema';

export const PHRASES = {
  jumpToProduct: {
    en: 'Jump to product',
    es: 'Ir al producto',
  },
  language: {
    en: 'Language',
    es: 'Idioma',
  },
  homepageSections: {
    en: 'Homepage sections',
    es: 'Secciones de portada',
  },
  contactEnterprise: {
    en: 'Contact us about Enterprise',
    es: 'Contacta con nosotros sobre Enterprise',
  },
  sendMessage: {
    en: 'Send message',
    es: 'Enviar mensaje',
  },
  sending: {
    en: 'Sending...',
    es: 'Enviando...',
  },
  name: {
    en: 'Name',
    es: 'Nombre',
  },
  email: {
    en: 'Email',
    es: 'Correo',
  },
  company: {
    en: 'Company',
    es: 'Empresa',
  },
  message: {
    en: 'Message',
    es: 'Mensaje',
  },
  productsOfInterest: {
    en: 'Products of interest',
    es: 'Productos de interes',
  },
  thanks: {
    en: 'Thanks — we will be in touch.',
    es: 'Gracias — te contactaremos pronto.',
  },
} as const satisfies Record<string, LocalizedText>;

export type PhraseKey = keyof typeof PHRASES;
