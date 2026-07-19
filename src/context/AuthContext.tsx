'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import AuthModal from '@/components/AuthModal';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

interface Profile {
  id: string;
  email: string;
  godsmoveId: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  tier: string;
  dob: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  requireAuth: (action: string, callback: () => void, pendingDetails?: any) => void;
  logout: () => Promise<void>;
  openAuthModal: (action?: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const router = useRouter();
  const clearCart = useStore((s) => s.clearCart);
  const clearWishlist = useStore((s) => s.clearWishlist);
  const addToCart = useStore((s) => s.addToCart);
  const toggleWishlist = useStore((s) => s.toggleWishlist);
  const setInstantCheckout = useStore((s) => s.setInstantCheckout);

  const [user, setUser] = useState<User | null>(
    process.env.NEXT_PUBLIC_DEV_MODE === 'true'
      ? ({
          id: '00000000-0000-0000-0000-000000000000',
          email: 'dev@godsmove.com',
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as any)
      : null
  );
  const [profile, setProfile] = useState<Profile | null>(
    process.env.NEXT_PUBLIC_DEV_MODE === 'true'
      ? {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'dev@godsmove.com',
          godsmoveId: 'DEV-USER-001',
          firstName: 'Dev',
          lastName: 'User',
          phone: '9876543210',
          role: 'ADMIN',
          tier: 'STANDARD',
          dob: null,
        }
      : null
  );
  const [loading, setLoading] = useState(
    process.env.NEXT_PUBLIC_DEV_MODE === 'true' ? false : true
  );

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<string | null>(null);
  const [onSuccessCallback, setOnSuccessCallback] = useState<(() => void) | null>(null);

  // Fetch profiles table record for the authenticated user
  async function fetchProfile(userId: string) {
    try {
      const response = await fetch(`/api/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (err) {
      console.error('Failed to fetch user profile details:', err);
    }
  }

  // Resume Pending Action on authentication
  useEffect(() => {
    if (user && !loading) {
      const pendingStr = sessionStorage.getItem('godsmove_pending_action');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          sessionStorage.removeItem('godsmove_pending_action');

          if (pending.type === 'cart') {
            addToCart(pending.product, pending.size, pending.quantity || 1);
          } else if (pending.type === 'wishlist') {
            toggleWishlist(pending.product);
          } else if (pending.type === 'checkout') {
            setInstantCheckout({ product: pending.product, size: pending.size, quantity: pending.quantity || 1 });
            router.push('/checkout');
          }
        } catch (e) {
          console.error('Failed to execute pending action:', e);
        }
      }
    }
  }, [user, loading, addToCart, toggleWishlist, setInstantCheckout, router]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      setLoading(false);
      return;
    }

    // Initial Session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        clearCart();
        clearWishlist();
      }
      setLoading(false);
    });

    // Auth State Change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.id);
      } else {
        setProfile(null);
        clearCart();
        clearWishlist();
      }
      setLoading(false);
      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  function requireAuth(action: string, callback: () => void, pendingDetails?: any) {
    if (user) {
      callback();
    } else {
      if (pendingDetails) {
        sessionStorage.setItem('godsmove_pending_action', JSON.stringify(pendingDetails));
      }
      setModalAction(action);
      setOnSuccessCallback(() => callback);
      setIsModalOpen(true);
    }
  }

  function openAuthModal(action?: string) {
    setModalAction(action || null);
    setIsModalOpen(true);
  }

  async function logout() {
    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      document.cookie = 'gm_logged_out=true; path=/; max-age=3600';
      document.cookie = 'gm_dev_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    await supabase.auth.signOut();
    // Clear all client Zustand stores
    clearCart();
    clearWishlist();
    // Redirect to home and refresh
    router.push('/');
    router.refresh();
  }

  async function refreshProfile() {
    if (user) {
      await fetchProfile(user.id);
    }
  }

  const handleModalSuccess = () => {
    if (onSuccessCallback) {
      onSuccessCallback();
    }
    setOnSuccessCallback(null);
    setModalAction(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        requireAuth,
        logout,
        openAuthModal,
        refreshProfile,
      }}
    >
      {children}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setOnSuccessCallback(null);
          setModalAction(null);
        }}
        onSuccess={handleModalSuccess}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
