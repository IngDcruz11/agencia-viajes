import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agencia de Viajes · Destinos',
  description: 'Administración de destinos - Agencia de Viajes y Turismo Multisucursal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
