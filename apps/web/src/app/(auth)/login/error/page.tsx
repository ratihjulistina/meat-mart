'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      console.error('Authentication error:', error);
      alert('Authentication error');
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p className="text-red-500 mb-6">{error || 'Unknown error occurred'}</p>
      <button
        onClick={() => router.push('/login')}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Return to Login
      </button>
    </div>
  );
}
