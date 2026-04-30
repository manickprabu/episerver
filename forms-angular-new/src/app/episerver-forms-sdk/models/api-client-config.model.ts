export interface ApiClientConfig {
  baseURL: string;
  headers: Record<string, string>;
}

export const DEFAULT_API_CLIENT_CONFIG: ApiClientConfig = {
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json'
  }
};
