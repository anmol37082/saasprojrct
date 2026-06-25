// Minimal Next type shims to allow strict TS compilation.
// This removes "Cannot find module 'next'" / Next type resolution issues
// when editor tooling doesn't load node_modules types.

declare module 'next' {
  export type NextConfig = {
    [key: string]: any;
  };
}

