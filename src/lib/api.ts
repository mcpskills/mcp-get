import { getConfig } from './config.js';
import type {
  PackageResponse,
  VersionResponse,
  DownloadResponse,
  SearchResponse,
  DeviceCodeResponse,
  AuthResponse
} from '../types.js';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;
  private token?: string;

  constructor() {
    const config = getConfig();
    this.baseUrl = config.apiUrl;
    this.token = config.token;
  }

  private async request<T>(path: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/api/v1${path}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client': 'mcp-get',
      'User-Agent': 'mcp-get/0.1.0',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const data = await response.json() as ApiResponse<T>;

      if (!response.ok) {
        return {
          error: data.error || 'request_failed',
          message: data.message || `Request failed with status ${response.status}`
        };
      }

      return data;
    } catch (error) {
      return {
        error: 'network_error',
        message: error instanceof Error ? error.message : 'Network request failed'
      };
    }
  }

  setToken(token: string): void {
    this.token = token;
  }

  // MCP server endpoints
  async listServers(params?: {
    search?: string;
    category?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<PackageResponse[]> & { pagination?: SearchResponse['pagination'] }> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    const response = await this.request<PackageResponse[]>(`/mcp${query ? `?${query}` : ''}`);

    return response as ApiResponse<PackageResponse[]> & { pagination?: SearchResponse['pagination'] };
  }

  async getServer(name: string): Promise<ApiResponse<PackageResponse>> {
    return this.request<PackageResponse>(`/mcp/${encodeURIComponent(name)}`);
  }

  async getServerVersions(name: string): Promise<ApiResponse<VersionResponse[]>> {
    return this.request<VersionResponse[]>(`/mcp/${encodeURIComponent(name)}/versions`);
  }

  async getServerVersion(name: string, version: string): Promise<ApiResponse<VersionResponse>> {
    return this.request<VersionResponse>(`/mcp/${encodeURIComponent(name)}/versions/${version}`);
  }

  async downloadServer(name: string, version: string = 'latest'): Promise<ApiResponse<DownloadResponse>> {
    return this.request<DownloadResponse>(`/mcp/${encodeURIComponent(name)}/versions/${version}/download`);
  }

  // Search
  async search(query: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<SearchResponse> {
    const searchParams = new URLSearchParams({ q: query, type: 'mcp' });
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const response = await this.request<PackageResponse[]>(`/search?${searchParams}`);

    return {
      data: response.data || [],
      query,
      pagination: (response as SearchResponse).pagination || {
        total: 0,
        page: 1,
        limit: 20,
        has_more: false
      }
    };
  }

  // Auth endpoints
  async initiateDeviceAuth(): Promise<ApiResponse<DeviceCodeResponse>> {
    return this.request<DeviceCodeResponse>('/auth/device', { method: 'POST' });
  }

  async pollDeviceAuth(deviceCode: string): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/auth/device/token', {
      method: 'POST',
      body: { device_code: deviceCode }
    });
  }

  async getUser(): Promise<ApiResponse<AuthResponse['user']>> {
    return this.request<AuthResponse['user']>('/auth/user');
  }

  // Publish endpoints
  async publishServer(data: {
    name: string;
    version: string;
    description?: string;
    keywords?: string[];
    category?: string;
    license?: string;
    repository?: string;
    readme?: string;
    config_schema?: object;
    dependencies?: string[];
  }): Promise<ApiResponse<{ name: string; version: string; type: string }>> {
    return this.request('/publish/mcp', {
      method: 'POST',
      body: data
    });
  }

  async getUserPackages(): Promise<ApiResponse<PackageResponse[]>> {
    return this.request<PackageResponse[]>('/publish/user/packages');
  }
}

export const api = new ApiClient();
export { ApiClient };
