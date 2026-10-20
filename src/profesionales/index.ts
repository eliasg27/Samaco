import { ProfesionalesService } from './service';
import { mockProfesionales } from './mock';
import { shopifyProfesionales } from './shopify';

/**
 * Provider del Círculo: Shopify si están las variables del login de clientes, si no el modo demo (localStorage).
 * VITE_CPS_PROVIDER="mock" fuerza el demo aunque estén las variables.
 */
const conShopify = Boolean(import.meta.env.VITE_SHOPIFY_SHOP_ID && import.meta.env.VITE_SHOPIFY_CUSTOMER_ACCOUNT_CLIENT_ID)
  && import.meta.env.VITE_CPS_PROVIDER !== 'mock';

export const profesionales: ProfesionalesService = conShopify ? shopifyProfesionales : mockProfesionales;
export const esModoDemo = !conShopify;
