import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import axiosInstance from '../utils/axios';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'voice_task_users_roster';

const VoiceTaskUsersContext = createContext(null);

const normalizeRoster = (list) => {
  if (!Array.isArray(list)) return [];
  return list
    .map((u) => ({
      id: Number(u?.id),
      first_name: String(u?.first_name || '').trim(),
      last_name: String(u?.last_name || '').trim(),
      email: String(u?.email || '').trim(),
      department: u?.department || null,
      role: u?.role || null,
    }))
    .filter((u) => Number.isInteger(u.id) && u.id > 0);
};

const readStoredRoster = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { users: [], loadedAt: null };
    const parsed = JSON.parse(raw);
    return {
      users: normalizeRoster(parsed?.users),
      loadedAt: parsed?.loadedAt || null,
    };
  } catch {
    return { users: [], loadedAt: null };
  }
};

export const VoiceTaskUsersProvider = ({ children }) => {
  const { user } = useAuth();
  const stored = useMemo(() => readStoredRoster(), []);
  const [users, setUsers] = useState(stored.users);
  const [loadedAt, setLoadedAt] = useState(stored.loadedAt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const persist = useCallback((nextUsers, nextLoadedAt) => {
    setUsers(nextUsers);
    setLoadedAt(nextLoadedAt);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ users: nextUsers, loadedAt: nextLoadedAt }),
      );
    } catch {
      // ignore quota errors
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/users/options', {
        params: { active: true },
      });
      const list = normalizeRoster(res.data?.data || res.data || []);
      const nextLoadedAt = new Date().toISOString();
      persist(list, nextLoadedAt);
      return list;
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to load users for voice tasks.';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [persist]);

  // Load once when logged in and roster is empty
  useEffect(() => {
    if (!user?.id) return;
    if (users.length > 0) return;
    refreshUsers().catch(() => undefined);
  }, [user?.id, users.length, refreshUsers]);

  // Clear on logout
  useEffect(() => {
    if (user?.id) return;
    setUsers([]);
    setLoadedAt(null);
    setError('');
  }, [user?.id]);

  const value = useMemo(
    () => ({
      users,
      loadedAt,
      loading,
      error,
      refreshUsers,
      userCount: users.length,
    }),
    [users, loadedAt, loading, error, refreshUsers],
  );

  return (
    <VoiceTaskUsersContext.Provider value={value}>
      {children}
    </VoiceTaskUsersContext.Provider>
  );
};

export const useVoiceTaskUsers = () => {
  const ctx = useContext(VoiceTaskUsersContext);
  if (!ctx) {
    throw new Error('useVoiceTaskUsers must be used within VoiceTaskUsersProvider');
  }
  return ctx;
};

export default VoiceTaskUsersContext;
