import axios from "axios";

const API_URL = "http://localhost:8000/api";

export interface AuthFormData {
  email: string;
  password: string;
  confirmPassword?: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface User {
  id: string;
  email: string;
}

class AuthService {
  private readonly TOKEN_KEY = "access_token";

  async signIn(data: AuthFormData): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/signin`, {
      email: data.email,
      password: data.password,
    });
    console.log(response.data);
    this.setToken(response.data.access_token);
    return response.data;
  }

  async signUp(data: AuthFormData): Promise<AuthResponse> {
    const response = await axios.post(`${API_URL}/auth/signup`, {
      email: data.email,
      password: data.password,
    });
    this.setToken(response.data.access_token);
    return response.data;
  }

  setToken(token: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  removeToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    delete axios.defaults.headers.common["Authorization"];
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  async getCurrentUser(): Promise<User> {
    const token = this.getToken();
    if (!token) {
      throw new Error("No token found");
    }

    const response = await axios.get<User>(`${API_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  }
}

export const authService = new AuthService();
