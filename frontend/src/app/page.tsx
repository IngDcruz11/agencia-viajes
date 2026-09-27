'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { obtenerSesion } from '@/lib/api';

export default function Inicio() {
  const router = useRouter();
  useEffect(() => {
    router.replace(obtenerSesion() ? '/destinos' : '/login');
  }, [router]);
  return null;
}
