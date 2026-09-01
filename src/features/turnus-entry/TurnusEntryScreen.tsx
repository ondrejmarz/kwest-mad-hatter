import { Navigate } from 'react-router-dom';

import { Spinner } from '../../ui/Spinner';
import { useSession } from '../session';

import { CodeEntryScreen } from './CodeEntryScreen';
import { TurnusPickerScreen } from './TurnusPickerScreen';

/** The `/enter` gate: pick a turnus, or enter its code, depending on session state (spec 3a). */
export function TurnusEntryScreen() {
  const { uid, turnus, role, roleLoading } = useSession();

  if (uid === null || (turnus !== null && roleLoading)) {
    return (
      <div className="flex min-h-full items-center justify-center bg-surface">
        <Spinner />
      </div>
    );
  }
  if (role !== null) return <Navigate to="/" replace />;
  if (turnus === null) return <TurnusPickerScreen />;
  return <CodeEntryScreen />;
}
