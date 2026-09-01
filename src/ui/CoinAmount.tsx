import { useTranslation } from '../i18n/LocaleProvider';
import { formatCoins } from '../i18n/plurals';
import { cx } from '../lib/cx';

/**
 * A coin amount with the correct per-locale plural (spec 15.9). `signed` shows a +/- delta
 * in success/danger colors (for the balance breakdown); otherwise it uses the neutral coin color.
 */
export function CoinAmount({
  amount,
  signed = false,
  className,
}: {
  amount: number;
  signed?: boolean;
  className?: string;
}) {
  const { locale } = useTranslation();
  const text =
    signed && amount > 0 ? `+${formatCoins(locale, amount)}` : formatCoins(locale, amount);
  const color = !signed
    ? 'text-coin'
    : amount > 0
      ? 'text-success'
      : amount < 0
        ? 'text-danger'
        : 'text-content-muted';
  return <span className={cx('font-semibold tabular-nums', color, className)}>{text}</span>;
}
