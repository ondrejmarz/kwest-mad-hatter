import { Navigate, Outlet } from 'react-router-dom';

import { useSession } from '../../features/session';
import { Spinner } from '../../ui/Spinner';

/** Game screens require an entered turnus with membership; otherwise go to the entry gate. */
export function RequireTurnus() {
  const { uid, turnus, role, roleLoading } = useSession();

  if (uid === null || (turnus !== null && roleLoading)) {
    return (
      <div className="flex min-h-full items-center justify-center bg-surface">
        <Spinner />
      </div>
    );
  }
  if (turnus === null || role === null) return <Navigate to="/enter" replace />;
  return <Outlet />;
}
