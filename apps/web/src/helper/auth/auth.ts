'use server';
import { cookies } from 'next/headers';
import { decode } from 'next-auth/jwt';
import { auth_secret } from '../config';
import { api } from '../api';
import { Address } from '@/interface/user/address.interface';

export const login = async (credentials: Partial<Record<string, unknown>>) => {
  try {
    const res = await api('auth/login', 'POST', {
      body: credentials,
      contentType: 'application/json',
    });

    if (!res.data?.access_token || !res.data?.refresh_token) {
      throw new Error(
        JSON.stringify({
          message: 'Invalid login response: Missing tokens',
          code: 500,
        }),
      );
    }

    return {
      access_token: res.data.access_token,
      refresh_token: res.data.refresh_token,
    };
  } catch (error) {
    console.error('Login error:', error);

    let errorMessage = 'Authentication failed';
    let errorCode = 500;

    if (error instanceof Error) {
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = errorData.message;
        errorCode = errorData.code || errorCode;
      } catch {
        errorMessage = error.message;
      }
    }

    throw new Error(
      JSON.stringify({
        message: errorMessage,
        code: errorCode,
      }),
    );
  }
};

export const register = async (newUser: { email: string }) => {
  try {
    const data = await api('auth/register', 'POST', {
      body: newUser,
      contentType: 'application/json',
    });

    return data;
  } catch (error) {
    console.error('Registration error:', error);

    let errorMessage = 'Registration failed';
    if (error instanceof Error) {
      try {
        const errorData = JSON.parse(error.message);
        errorMessage = errorData.message || error.message;
      } catch {
        errorMessage = error.message;
      }
    }

    return { error: errorMessage };
  }
};

export const verifyEmail = async (token: string, password: string) => {
  try {
    const data = await api('auth/verify', 'POST', {
      body: { token, password },
      contentType: 'application/json',
    });

    return data;
  } catch (error) {
    console.error('Verification error:', error);
    return {
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
};

export const resendVerificationEmail = async (email: string) => {
  try {
    const data = await api('auth/resend-verification', 'POST', {
      body: { email },
      contentType: 'application/json',
    });

    return data;
  } catch (error) {
    console.error('Resend verification error', error);
    return {
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
};

export const resetEmail = async (email: string) => {
  try {
    const data = await api('auth/reset-email', 'POST', {
      body: { email },
      contentType: 'application/json',
    });

    return data;
  } catch (error) {
    console.error('Reset email error', error);
    return {
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    };
  }
};

export const resetPassword = async (token: string, password: string) => {
  try {
    const data = await api('auth/reset-password', 'POST', {
      body: { token, password },
      contentType: 'application/json',
    });
    console.log('Registration success:', data);
    return data;
  } catch (error) {
    console.log('Reset password error', error);
  }
};

export const refreshToken = async () => {
  const cookie = cookies();
  const ntoken = cookie.get('next-auth.session-token')?.value;
  if (!ntoken) throw new Error('No session token found');
  const decoded = (await decode({
    token: ntoken,
    secret: auth_secret,
    salt: 'next-auth.session-token',
  })) as { refresh_token?: string };

  if (!decoded?.refresh_token) {
    throw new Error('No refresh token in session');
  }

  const res = await api('auth/token', 'POST', {}, decoded.refresh_token);

  if (!res.data?.access_token || !res.data?.refresh_token) {
    throw new Error('Invalid token response');
  }

  return {
    access_token: res.data.access_token,
    refresh_token: res.data.refresh_token,
  };
};

export const updateUser = async (data: {
  emailUpdate: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
  newPassword: string;
}) => {
  try {
    await api('auth/', 'PATCH', {
      body: data,
      contentType: 'application/json',
    });
  } catch (error) {
    console.log('Error UPDATE PROFILE', error);
  }
  return data;
};

export const getProfile = async (email: string) => {
  try {
    const res = await api('auth/profile', 'POST', {
      body: { email },
      contentType: 'application/json',
    });

    return res.data;
  } catch (error) {
    console.log('Error UPDATE PROFILE', error);
  }
};

export async function registerSocialUser(data: {
  email: string;
  fullName: string;
  image?: string;
  provider: string;
  provider_id: string;
}) {
  try {
    const res = await api('auth/social', 'POST', {
      body: data,
      contentType: 'application/json',
    });

    if (!res.data?.access_token || !res.data?.refresh_token) {
      throw new Error('Invalid social login response');
    }

    return {
      user: {
        email: data.email,
        first_name: data.fullName.split(' ')[0],
        last_name: data.fullName.split(' ')[1] || '',
        image_url: data.image,
        provider: data.provider,
        is_verified: true,
        role: 'CUSTOMER',
      },
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
    };
  } catch (error) {
    console.error('Social registration error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Social registration failed',
    );
  }
}

export const updateProfileImage = async (email: string, imageUrl: string) => {
  const response = await api('auth/profile/image', 'POST', {
    body: { email, imageUrl },
    contentType: 'application/json',
  });
  return response;
};

export async function getUserAddresses(email: string): Promise<Address[]> {
  const response = await api(
    `addresses/get?email=${encodeURIComponent(email)}`,
    'GET',
    {
      contentType: 'application/json',
    },
  );

  return response.data;
}

export async function addUserAddress(
  email: string,
  address: Omit<Address, 'id'>,
): Promise<Address> {
  const response = await api('addresses/', 'POST', {
    body: { email, address },
    contentType: 'application/json',
  });

  return response.data;
}

export async function updateUserAddress(
  email: string,
  id: string,
  address: Address,
): Promise<Address> {
  const response = await api(`addresses/${id}`, 'PATCH', {
    body: { email, address },
    contentType: 'application/json',
  });
  console.log('Address Id', id);
  return response.data;
}

export async function deleteUserAddress(
  email: string,
  id: string,
): Promise<void> {
  try {
    console.log('Deleting address ID:', id);
    const response = await api(`addresses/${id}`, 'DELETE', {
      body: { email },
      contentType: 'application/json',
    });
    return response;
  } catch (error) {
    console.error('Delete address error:', error);
    throw error;
  }
}

export async function setPrimaryAddress(
  email: string,
  id: string,
): Promise<Address[]> {
  const response = await api(`addresses/${id}/primary`, 'PATCH', {
    body: { email },
    contentType: 'application/json',
  });

  return response.data;
}
