// Global JSX/React types fix for strict TS environments.
// This prevents `JSX element implicitly has type 'any'` errors when
// `JSX.IntrinsicElements` is not resolved correctly.

import type * as React from 'react';

// Ensure intrinsic elements and JSX.Element exist for strict TS.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }

    type Element = React.ReactElement<any, any>;
  }
}

export {};



