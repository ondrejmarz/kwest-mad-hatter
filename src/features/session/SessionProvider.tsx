import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { auth, db } from '../../data/firebase';
import { subscribeMyRole } from '../../data/repositories/turnus';
import type { Role } from '../../data/schemas/turnus';
import {
  clearRememberedTurnus,
  readRememberedTurnus,
  type RememberedTurnus,
  writeRememberedTurnus,
} from '../../platform/session/turnus';

/**
 * The device session (spec 3): an anonymous uid, the entered turnus (remembered across
 * visits), and this device's role in it. It lives in a feature (not `app/` or `platform/`)
 * so both the app shell and other features can read it while it still imports the data layer.
 * Role comes straight from the `roles/{uid}` listener — `null` means "at a turnus but not a
 * member yet" (needs the code).
 */
interface SessionValue {
  readonly uid: string | null;
  readonly turnus: RememberedTurnus | null;
  readonly role: Role | null;
  readonly roleLoading: boolean;
  readonly enterTurnus: (turnus: RememberedTurnus) => void;
  readonly switchTurnus: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [uid, setUid] = useState<string | null>(null);
  const [turnus, setTurnus] = useState<RememberedTurnus | null>(() => readRememberedTurnus());
  const [role, setRole] = useState<Role | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);

  // One anonymous uid per device (spec 3b).
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      } else {
        void signInAnonymously(auth).catch(() => undefined);
      }
    });
  }, []);

  // Learn this device's role in the current turnus (spec 4).
  useEffect(() => {
    if (uid === null || turnus === null) {
      setRole(null);
      setRoleLoading(false);
      return;
    }
    setRoleLoading(true);
    return subscribeMyRole(db, turnus.id, uid, (state) => {
      if (state.status === 'ready') {
        setRole(state.data);
        setRoleLoading(false);
      } else if (state.status === 'error') {
        setRole(null);
        setRoleLoading(false);
      }
    });
  }, [uid, turnus]);

  const enterTurnus = useCallback((next: RememberedTurnus) => {
    writeRememberedTurnus(next);
    setTurnus(next);
  }, []);

  const switchTurnus = useCallback(() => {
    clearRememberedTurnus();
    setTurnus(null);
    setRole(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({ uid, turnus, role, roleLoading, enterTurnus, switchTurnus }),
    [uid, turnus, role, roleLoading, enterTurnus, switchTurnus],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
