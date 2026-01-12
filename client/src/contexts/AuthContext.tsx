import { useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import AuthContext from './authContextCore';

interface Props {
  children?: ReactNode;
}

const AuthProvider = ({ children }: Props) => {
  const [user, setUser] = useState<import('./authContextCore').User | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      axios
        .get(`${import.meta.env.VITE_API_URL}/auth/me`)
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          delete axios.defaults.headers.common.Authorization;
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, {
      email,
      password,
    });
    const { token, user } = res.data;
    localStorage.setItem('token', token);
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
    setUser(user);
  };

  const register = async (email: string, password: string) => {
    await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, {
      email,
      password,
    });
  };

  const logout = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`);
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem('token');
    delete axios.defaults.headers.common.Authorization;
    setUser(null);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
