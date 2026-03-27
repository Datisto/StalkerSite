const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

type ApiPayload = Record<string, unknown>;

interface AuthVerifyResponse {
  token?: string;
  error?: string;
  reason?: string;
}

interface AuthUser {
  id: string;
  steam_id: string;
  steam_nickname: string;
  discord_id?: string | null;
  discord_username?: string | null;
  is_banned: boolean;
  rules_passed?: boolean;
}

interface CharacterRecord {
  id: string;
  steam_id: string;
  user_id?: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'archived' | 'dead';
  name: string;
  surname: string;
  patronymic?: string | null;
  nickname?: string | null;
  discord_id?: string | null;
  age: number;
  gender: 'male' | 'female';
  faction: string;
  face_model?: string;
  hair_color?: string;
  eye_color?: string;
  beard_style?: string | null;
  special_features?: string | null;
  height?: number;
  weight?: number;
  body_type?: string;
  physical_features?: string | null;
  character_traits?: string[] | string;
  phobias?: string | null;
  character_values?: string | null;
  education?: string | null;
  scientific_profile?: string | null;
  research_motivation?: string | null;
  military_experience?: string | null;
  military_rank?: string | null;
  military_join_reason?: string | null;
  backstory?: string;
  zone_motivation?: string;
  character_goals?: string | null;
  created_at?: string;
  rejection_reason?: string | null;
  [key: string]: unknown;
}

interface AdminLoginResponse {
  token: string;
  admin: {
    id: string;
    username: string;
    role: 'super_admin' | 'moderator' | 'content_manager';
    permissions?: string[];
  };
}

interface AdminUserRecord {
  id: string;
  steam_id: string;
  steam_nickname: string;
  discord_id?: string | null;
  discord_username?: string | null;
  rules_passed: boolean;
  is_banned: boolean;
  created_at: string;
  last_login: string;
  [key: string]: unknown;
}

interface TestSubmissionRecord {
  id: string;
  steam_id: string;
  discord_id?: string | null;
  approved?: boolean | null;
  reviewed_at?: string | null;
  [key: string]: unknown;
}

interface RuleCategoryRecord {
  id: string;
  title: string;
  slug: string;
  order_index: number;
}

interface RuleRecord {
  id: string;
  category_id: string;
  parent_id?: string | null;
  number: string;
  title: string;
  content: string;
  order_index: number;
  [key: string]: unknown;
}

interface QuestionRecord {
  id: string;
  question_text: string;
  category: string;
  is_active: boolean;
  created_at: string;
  [key: string]: unknown;
}

interface FAQCategoryRecord {
  id: string;
  title: string;
  slug: string;
  order_index: number;
}

interface FAQRecord {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  order_index: number;
  is_visible: boolean;
  [key: string]: unknown;
}

interface FaceModelRecord {
  id: string;
  name: string;
  image_url: string;
  is_unique: boolean;
  display_order: number;
  gender: 'male' | 'female';
  [key: string]: unknown;
}

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
    const headers = new Headers(options.headers);

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (this.token) {
      headers.set('Authorization', `Bearer ${this.token}`);
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

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
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
      const response = await this.get<AuthVerifyResponse>(`/steam-auth/verify?${params.toString()}`);
      if (response.token) {
        this.setToken(response.token);
      }
      return response;
    },

    signOut: () => {
      this.setToken(null);
    },

    getCurrentUser: () => this.get<AuthUser>('/users/me'),
  };

  users = {
    get: (steamId: string) => this.get<AuthUser>(`/users/${steamId}`),
    update: (data: Partial<AuthUser>) => this.patch<AuthUser>('/users/me', data),
  };

  characters = {
    list: (params?: { steam_id?: string; status?: string }) => {
      const query = new URLSearchParams(
        Object.entries(params ?? {}).reduce<Record<string, string>>((acc, [key, value]) => {
          if (value) {
            acc[key] = value;
          }
          return acc;
        }, {})
      ).toString();
      return this.get<CharacterRecord[]>(`/characters${query ? `?${query}` : ''}`);
    },
    get: (id: string) => this.get<CharacterRecord>(`/characters/${id}`),
    create: (data: ApiPayload) => this.post<CharacterRecord>('/characters', data),
    update: (id: string, data: ApiPayload) => this.patch<CharacterRecord>(`/characters/${id}`, data),
    delete: (id: string) => this.delete<{ success: boolean }>(`/characters/${id}`),
  };

  admin = {
    login: (username: string, password: string) =>
      this.post<AdminLoginResponse>('/admin/login', { username, password }).then((res) => {
        this.setToken(res.token);
        return res;
      }),

    characters: {
      list: (status?: string) => {
        const query = status ? `?status=${status}` : '';
        return this.get<CharacterRecord[]>(`/admin/characters${query}`);
      },
      update: (id: string, data: ApiPayload) => this.patch<CharacterRecord>(`/admin/characters/${id}`, data),
    },

    users: {
      list: () => this.get<AdminUserRecord[]>('/admin/users'),
      update: (id: string, data: ApiPayload) => this.patch<AdminUserRecord>(`/admin/users/${id}`, data),
    },

    testSubmissions: {
      list: () => this.get<TestSubmissionRecord[]>('/admin/test-submissions'),
      update: (id: string, data: ApiPayload) => this.patch<TestSubmissionRecord>(`/admin/test-submissions/${id}`, data),
    },
  };

  rules = {
    categories: {
      list: () => this.get<RuleCategoryRecord[]>('/rules/categories'),
      create: (data: ApiPayload) => this.post<RuleCategoryRecord>('/rules/categories', data),
      update: (id: string, data: ApiPayload) => this.patch<RuleCategoryRecord>(`/rules/categories/${id}`, data),
      delete: (id: string) => this.delete<{ success: boolean }>(`/rules/categories/${id}`),
    },
    list: () => this.get<RuleRecord[]>('/rules'),
    create: (data: ApiPayload) => this.post<RuleRecord>('/rules', data),
    update: (id: string, data: ApiPayload) => this.patch<RuleRecord>(`/rules/${id}`, data),
    delete: (id: string) => this.delete<{ success: boolean }>(`/rules/${id}`),
  };

  questions = {
    list: () => this.get<QuestionRecord[]>('/questions'),
    create: (data: ApiPayload) => this.post<QuestionRecord>('/questions', data),
    update: (id: string, data: ApiPayload) => this.patch<QuestionRecord>(`/questions/${id}`, data),
    delete: (id: string) => this.delete<{ success: boolean }>(`/questions/${id}`),
  };

  testSubmissions = {
    list: (steamId?: string) => {
      const query = steamId ? `?steam_id=${steamId}` : '';
      return this.get<TestSubmissionRecord[]>(`/test-submissions${query}`);
    },
    create: (data: ApiPayload) => this.post<TestSubmissionRecord>('/test-submissions', data),
    delete: (id: string) => this.delete<{ success: boolean }>(`/test-submissions/${id}`),
  };

  faq = {
    categories: {
      list: () => this.get<FAQCategoryRecord[]>('/faq/categories'),
      create: (data: ApiPayload) => this.post<FAQCategoryRecord>('/faq/categories', data),
      update: (id: string, data: ApiPayload) => this.patch<FAQCategoryRecord>(`/faq/categories/${id}`, data),
      delete: (id: string) => this.delete<{ success: boolean }>(`/faq/categories/${id}`),
    },
    list: () => this.get<FAQRecord[]>('/faq'),
    create: (data: ApiPayload) => this.post<FAQRecord>('/faq', data),
    update: (id: string, data: ApiPayload) => this.patch<FAQRecord>(`/faq/${id}`, data),
    delete: (id: string) => this.delete<{ success: boolean }>(`/faq/${id}`),
  };

  faceModels = {
    list: (gender?: string) => {
      const query = gender ? `?gender=${gender}` : '';
      return this.get<FaceModelRecord[]>(`/face-models${query}`);
    },
    create: (data: ApiPayload) => this.post<FaceModelRecord>('/face-models', data),
    update: (id: string, data: ApiPayload) => this.patch<FaceModelRecord>(`/face-models/${id}`, data),
    delete: (id: string) => this.delete<{ success: boolean }>(`/face-models/${id}`),
  };
}

export const apiClient = new APIClient();
