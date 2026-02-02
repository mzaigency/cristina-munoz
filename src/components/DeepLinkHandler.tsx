import { useDeepLinks } from '@/hooks/useDeepLinks';

/**
 * Componente que inicializa el manejo de deep links para iOS/Android
 * Debe montarse dentro de la app para interceptar callbacks de autenticación
 */
export const DeepLinkHandler = () => {
  useDeepLinks();
  return null;
};
