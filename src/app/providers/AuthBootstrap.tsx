import { PropsWithChildren, useEffect } from 'react';
import { useAuthStore } from '../../scripts/store/auth.store';

export function AuthBootstrap({ children }: PropsWithChildren) {
  const bootstrap = useAuthStore((state) => state.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  return <>{children}</>;
}
