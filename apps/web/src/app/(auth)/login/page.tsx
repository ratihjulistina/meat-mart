'use client';
import { useFormik } from 'formik';
import Image from 'next/image';
import Link from 'next/link';
import React, { useRef, useState } from 'react';
import { googleLogin, login } from '@/app/action/auth';
import { useRouter } from 'next/navigation';
import { Alert, Button, CircularProgress, Snackbar } from '@mui/material';
import { signIn, SignInResponse, useSession } from 'next-auth/react';

export default function Page() {
  const router = useRouter();
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [errMessage, setErrMessage] = useState('');
  const [isLoading, setIsLoading] = useState({
    google: false,
    regular: false,
  });
  const { data: session } = useSession();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    onSubmit: async (values) => {
      try {
        setIsLoading({ ...isLoading, regular: true });
        setErrMessage('');

        const result = await login(values);

        if (result?.error) {
          setErrMessage(result.error);
        } else {
          setOpenSnackbar(true);
          router.push('/');
        }
      } catch (error: any) {
        setErrMessage(
          error.message || 'An unexpected error occurred. Please try again.',
        );
      } finally {
        setIsLoading({ ...isLoading, regular: false });
      }
    },
  });

  const handleGoogleLogin = async () => {
    try {
      setIsLoading({ ...isLoading, google: true });
      setErrMessage('');

      const result = await signIn('google', {
        redirect: false,
        callbackUrl: '/',
      });

      if (result?.error) {
        setErrMessage(result.error);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (error) {
      setErrMessage('Failed to login with Google');
    } finally {
      setIsLoading({ ...isLoading, google: false });
    }
  };

  return (
    <div className="w-full max-w-[450px]">
      <div className="mb-4">
        <h4 className="text-[21px] font-bold mb-1">Login</h4>
        <h5 className="mb-2">
          {"Don't have an account? "}
          <Link href={'/register'} className="green font-semibold">
            Sign up here
          </Link>
        </h5>
      </div>

      <form className="w-full" onSubmit={formik.handleSubmit}>
        <input
          type="email"
          autoComplete="username"
          required
          className="w-full p-4 mb-4 border rounded-md"
          placeholder="Email Address"
          name="email"
          value={formik.values.email}
          onChange={formik.handleChange}
          disabled={isLoading.regular}
        />

        <input
          type="password"
          autoComplete="current-password"
          className="w-full p-4 mb-4 border rounded-md"
          placeholder="Password"
          name="password"
          required
          value={formik.values.password}
          onChange={formik.handleChange}
          disabled={isLoading.regular}
        />

        {errMessage && (
          <p className="text-red-600 mb-4 text-xs">{errMessage}</p>
        )}

        <button
          type="submit"
          className={`${
            isLoading.regular
              ? 'bg-gray-300 text-gray-400'
              : 'bg-primaryGreen text-white'
          } font-semibold p-4 w-full rounded-[50px] mb-6 flex justify-center items-center`}
          disabled={isLoading.regular}
        >
          {isLoading.regular ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Login'
          )}
        </button>
      </form>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={1500}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" sx={{ width: '100%' }}>
          Login Successful
        </Alert>
      </Snackbar>

      <center>
        <Link href={'/forgot'} className="green font-bold">
          Forgot password?
        </Link>
        <h5 className="mt-6 mb-2">Login instantly using your social media</h5>

        <div className="mb-6 space-y-3">
          <Button
            variant="outlined"
            fullWidth
            onClick={handleGoogleLogin}
            disabled={isLoading.google}
            startIcon={
              isLoading.google ? (
                <CircularProgress size={20} />
              ) : (
                <Image src="/google.png" alt="Google" width={20} height={20} />
              )
            }
            sx={{
              py: 1.5,
              textTransform: 'none',
              fontSize: '0.875rem',
              borderColor: '#ddd',
              color: '#444',
              '&:hover': {
                borderColor: '#ccc',
                backgroundColor: 'rgba(0,0,0,0.02)',
              },
            }}
          >
            {isLoading.google ? 'Processing...' : 'Continue with Google'}
          </Button>
        </div>
      </center>
    </div>
  );
}
