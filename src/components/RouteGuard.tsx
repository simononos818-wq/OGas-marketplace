'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

const publicRoutes = ['/login', '/register', '/verify-phone', '/forgot-password'];

export function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (publicRoutes.some(route => pathname?.startsWith(route))) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      switch (user.role) {
        case 'customer':
          router.push('/dashboard');
          break;
        case 'driver':
          router.push('/driver/dashboard');
          break;
        case 'admin':
          router.push('/admin/dashboard');
          break;
      }
    }
  }, [user, loading, pathname, router, allowedRoles]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (publicRoutes.some(route => pathname?.startsWith(route))) {
    return <>{children}</>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
