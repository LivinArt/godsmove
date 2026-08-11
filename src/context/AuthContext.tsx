'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import AuthModal from '@/components/AuthModal';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { isProfileComplete } from '@/lib/profile-utils';

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
  gender: string | null;
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
  const beginInstantCheckout = useStore((s) => s.beginInstantCheckout);

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Resume Pending Action on authentication & ensure profile completion
  useEffect(() => {
    if (user && !loading && profile) {
      const isComplete = isProfileComplete(profile);

      if (!isComplete) {
        setIsModalOpen(true);
        return;
      }

      const pendingStr = sessionStorage.getItem('godsmove_pending_action');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          sessionStorage.removeItem('godsmove_pending_action');

          if (pending.timestamp && Date.now() - pending.timestamp > 15 * 60 * 1000) {
            return;
          }

          if (pending.type === 'cart') {
            addToCart(pending.product, pending.size, pending.quantity || 1);
          } else if (pending.type === 'wishlist') {
            if (pending.product) {
              toggleWishlist(pending.product);
            } else {
              router.push('/wishlist');
            }
          } else if (pending.type === 'checkout' || pending.type === 'BUY_NOW') {
            if (pending.product) {
              beginInstantCheckout({ product: pending.product, size: pending.size, quantity: pending.quantity || 1 });
            }
            router.push('/checkout');
          } else if (pending.type === 'profile') {
            router.push('/profile');
          } else if (pending.type === 'membership') {
            router.push('/membership');
          } else if (pending.type === 'notify' && pending.product) {
            import('@/actions/prebooking-interest.actions').then(({ togglePreBookingInterestAction }) => {
              togglePreBookingInterestAction(pending.product.id).then((res) => {
                if (res.success && typeof window !== 'undefined') {
                  window.dispatchEvent(
                    new CustomEvent('gm_notify_interest_updated', {
                      detail: { productId: pending.product.id, registered: true, alreadyRegistered: Boolean(res.alreadyRegistered) },
                    })
                  );
                }
              });
            });
          } else if (pending.type === 'navigate' && pending.url) {
            router.push(pending.url);
          }
        } catch (e) {
          console.error('Failed to execute pending action:', e);
        }
      }
    }
  }, [user, loading, profile, addToCart, toggleWishlist, beginInstantCheckout, router]);

  useEffect(() => {
    // Initial Session check via Supabase Auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
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
      const details = pendingDetails || { type: action };
      const payload = {
        ...details,
        timestamp: Date.now(),
      };
      sessionStorage.setItem('godsmove_pending_action', JSON.stringify(payload));
      setModalAction(action);
      setOnSuccessCallback(() => callback);
      setIsModalOpen(true);
    }
  }

  function openAuthModal(action?: string) {
    if (action) {
      sessionStorage.setItem('godsmove_pending_action', JSON.stringify({ type: action, timestamp: Date.now() }));
    }
    setModalAction(action || null);
    setIsModalOpen(true);
  }

  async function logout() {
    // 1. Close any modal & callbacks
    setIsModalOpen(false);
    setOnSuccessCallback(null);
    setModalAction(null);
    sessionStorage.removeItem('godsmove_pending_action');

    // 2. Clear local states immediately
    setUser(null);
    setProfile(null);
    clearCart();
    clearWishlist();

    // 3. Navigate away to home page '/' FIRST so middleware doesn't intercept /profile as unauthenticated
    router.replace('/');

    // 4. Destroy Supabase session
    await supabase.auth.signOut();
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
    } else {
      const pendingStr = sessionStorage.getItem('godsmove_pending_action');
      if (pendingStr) {
        try {
          const pending = JSON.parse(pendingStr);
          sessionStorage.removeItem('godsmove_pending_action');
          if (pending.timestamp && Date.now() - pending.timestamp > 15 * 60 * 1000) {
            // Expired
          } else if (pending.type === 'cart') {
            addToCart(pending.product, pending.size, pending.quantity || 1);
          } else if (pending.type === 'wishlist') {
            if (pending.product) {
              toggleWishlist(pending.product);
            } else {
              router.push('/wishlist');
            }
          } else if (pending.type === 'checkout' || pending.type === 'BUY_NOW') {
            if (pending.product) {
              beginInstantCheckout({ product: pending.product, size: pending.size, quantity: pending.quantity || 1 });
            }
            router.push('/checkout');
          } else if (pending.type === 'profile') {
            router.push('/profile');
          } else if (pending.type === 'navigate' && pending.url) {
            router.push(pending.url);
          }
        } catch (e) {
          console.error('Failed to execute pending action:', e);
        }
      }
    }
    setOnSuccessCallback(null);
    setModalAction(null);
    setIsModalOpen(false);
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
          sessionStorage.removeItem('godsmove_pending_action');
        }}
        onSuccess={handleModalSuccess}
        redirectPath={modalAction === 'profile' ? '/profile' : undefined}
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
