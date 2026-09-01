import { Navigate, Outlet } from 'react-router-dom';

import { useSession } from '../../features/session';

/** Admin-only routes; non-admins are bounced to the players screen. */
export function RequireAdmin() {
  const { role } = useSession();
  return role === 'admin' ? <Outlet /> : <Navigate to="/players" replace />;
}
