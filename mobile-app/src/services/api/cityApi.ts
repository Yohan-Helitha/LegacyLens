import { apiGet } from './client';
import { City } from '../../types/city';

/** Public — GET /api/cities. Backs the signup city picker. */
export const cityApi = {
  getAll: () => apiGet<City[]>('/cities'),
};
