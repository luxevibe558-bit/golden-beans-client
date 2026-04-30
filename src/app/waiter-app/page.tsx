'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WaiterAppRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/waiter');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0F3D2E',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <p style={{ color: '#E8C895', fontFamily: 'DM Sans, sans-serif', fontSize: '16px' }}>
        Loading...
      </p>
    </div>
  );
}