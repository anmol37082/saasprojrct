"use client";

import { createContext, useContext } from 'react';

export type ToastTone = 'success' | 'error' | 'info';

export type ToastInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
};

export type ToastApi = {
  toast: (input: ToastInput) => void;
};

export const ToastContext = createContext<ToastApi | undefined>(undefined);

export function useToastContext() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToastContext must be used within ToastProvider');
  return ctx;
}

