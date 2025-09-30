"use client"

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

export function AuthStateHydrator() {
  useEffect(() => {
    const token = localStorage.getItem('paintflow_token');
    const userString = localStorage.getItem('paintflow_user');

    if (token && userString) {
      try {
        const user = JSON.parse(userString);
        // Use the login function from the store to re-populate the state
        useAuthStore.getState().login(token, user);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        // Clear storage if user data is corrupt
        useAuthStore.getState().logout();
      }
    }
  }, []);

  return null; // This component does not render anything
}
