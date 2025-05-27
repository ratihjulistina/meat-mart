/** @format */

'use server';

import { signIn, signOut } from '@/auth';
import { redirect } from 'next/navigation';

export const login = async (credentials: {
  email: string;
  password: string;
}) => {
  try {
    const result = await signIn('credentials', {
      ...credentials,
      redirect: false,
    });

    if (result?.error) {
      let errorMessage = result.error;
      try {
        const errorData = JSON.parse(result.error);
        errorMessage = errorData.message;
      } catch {}

      return { error: errorMessage };
    }

    return result;
  } catch (error: any) {
    let errorMessage = 'Authentication failed';
    if (error instanceof Error) {
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = errorData.message;
      } catch {
        errorMessage = error.message;
      }
    }
    return { error: errorMessage };
  }
};

export const googleLogin = async () => {
  try {
    return await signIn('google', {
      redirect: true,
      callbackUrl: '/',
    });
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
};

export const logout = async () => {
  await signOut({ redirect: true, redirectTo: '/' });
};
