const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class APIClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken() {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  auth = {
    steamLogin: (returnUrl: string) => {
      window.location.href = `${API_URL}/steam-auth/login?return_url=${encodeURIComponent(returnUrl)}`;
    },

    verify: async (queryParams: URLSearchParams) => {
      const params = new URLSearchParams();
      queryParams.forEach((value, key) => {
        params.append(key, value);
      });
      const response = await this.get<any>(`/steam-auth/verify?${params.toString()}`);
      if (response.token) {
        this.setToken(response.token);
      }
      return response;
    },

    signOut: () => {
      this.setToken(null);
    },

    getCurrentUser: () => this.get<any>('/users/me'),
  };

  users = {
    get: (steamId: string) => this.get<any>(`/users/${steamId}`),
    update: (data: any) => this.patch<any>('/users/me', data),
  };

  characters = {
    list: (params?: { steam_id?: string; status?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return this.get<any[]>(`/characters${query ? `?${query}` : ''}`);
    },
    get: (id: string) => this.get<any>(`/characters/${id}`),
    create: (data: any) => this.post<any>('/characters', data),
    update: (id: string, data: any) => this.patch<any>(`/characters/${id}`, data),
    delete: (id: string) => this.delete<any>(`/characters/${id}`),
  };

  admin = {
    login: (username: string, password: string) =>
      this.post<any>('/admin/login', { username, password }).then(res => {
        this.setToken(res.token);
        return res;
      }),

    characters: {
      list: (status?: string) => {
        const query = status ? `?status=${status}` : '';
        return this.get<any[]>(`/admin/characters${query}`);
      },
      update: (id: string, data: any) => this.patch<any>(`/admin/characters/${id}`, data),
    },

    users: {
      list: () => this.get<any[]>('/admin/users'),
      update: (id: string, data: any) => this.patch<any>(`/admin/users/${id}`, data),
    },

    testSubmissions: {
      list: () => this.get<any[]>('/admin/test-submissions'),
      update: (id: string, data: any) => this.patch<any>(`/admin/test-submissions/${id}`, data),
    },
  };

  rules = {
    categories: {
      list: () => this.get<any[]>('/rules/categories'),
      create: (data: any) => this.post<any>('/rules/categories', data),
    },
    list: () => this.get<any[]>('/rules'),
    create: (data: any) => this.post<any>('/rules', data),
    update: (id: string, data: any) => this.patch<any>(`/rules/${id}`, data),
    delete: (id: string) => this.delete<any>(`/rules/${id}`),
  };

  questions = {
    list: () => this.get<any[]>('/questions'),
    create: (data: any) => this.post<any>('/questions', data),
    update: (id: string, data: any) => this.patch<any>(`/questions/${id}`, data),
    delete: (id: string) => this.delete<any>(`/questions/${id}`),
  };

  testSubmissions = {
    list: (steamId?: string) => {
      const query = steamId ? `?steam_id=${steamId}` : '';
      return this.get<any[]>(`/test-submissions${query}`);
    },
    create: (data: any) => this.post<any>('/test-submissions', data),
    delete: (id: string) => this.delete<any>(`/test-submissions/${id}`),
  };

  faq = {
    categories: {
      list: () => this.get<any[]>('/faq/categories'),
      create: (data: any) => this.post<any>('/faq/categories', data),
    },
    list: () => this.get<any[]>('/faq'),
    create: (data: any) => this.post<any>('/faq', data),
    update: (id: string, data: any) => this.patch<any>(`/faq/${id}`, data),
    delete: (id: string) => this.delete<any>(`/faq/${id}`),
  };

  faceModels = {
    list: (gender?: string) => {
      const query = gender ? `?gender=${gender}` : '';
      return this.get<any[]>(`/face-models${query}`);
    },
    create: (data: any) => this.post<any>('/face-models', data),
    update: (id: string, data: any) => this.patch<any>(`/face-models/${id}`, data),
    delete: (id: string) => this.delete<any>(`/face-models/${id}`),
  };
}

export const apiClient = new APIClient();
