import { type ReactNode, useState } from 'react';

import { useTranslation } from '../../i18n/LocaleProvider';
import { Button } from '../../ui/Button';
import { InstallInstructionsDialog } from '../install';

/** The Aplikace tab (spec 9): a short "what is this app" — a PWA, theme-aware, and its build. */
export function EntryAboutScreen() {
  const { t } = useTranslation();
  const [installOpen, setInstallOpen] = useState(false);
  return (
    <section className="flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-xl font-bold text-content sm:text-2xl">{t('about.title')}</h1>
        <p className="mt-2 text-content-muted">{t('about.intro')}</p>
      </header>

      <div className="flex flex-col gap-3">
        <InfoCard title={t('about.pwaTitle')}>
          <p>{t('about.pwaBody')}</p>
          <Button
            variant="secondary"
            className="mt-3 self-end"
            onClick={() => setInstallOpen(true)}
          >
            {t('about.installButton')}
          </Button>
        </InfoCard>
        <InfoCard title={t('about.themeTitle')}>
          <p>{t('about.themeBody')}</p>
        </InfoCard>
      </div>

      <p className="text-center text-xs tabular-nums text-content-muted">
        {t('about.version', { version: __APP_VERSION__ })}
      </p>

      <InstallInstructionsDialog open={installOpen} onClose={() => setInstallOpen(false)} />
    </section>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-surface-raised p-4">
      <h2 className="font-semibold text-content">{title}</h2>
      <div className="mt-1 text-sm text-content-muted">{children}</div>
    </div>
  );
}
