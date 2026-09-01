import { Outlet } from 'react-router-dom';

import {
  CatalogProvider,
  PlayersProvider,
  ReservationProvider,
  TurnusProvider,
} from '../../features/session';

/** Turnus-scoped live-data listeners, mounted once for the whole game shell (spec 15.7). */
export function GameProviders() {
  return (
    <TurnusProvider>
      <PlayersProvider>
        <CatalogProvider>
          <ReservationProvider>
            <Outlet />
          </ReservationProvider>
        </CatalogProvider>
      </PlayersProvider>
    </TurnusProvider>
  );
}
