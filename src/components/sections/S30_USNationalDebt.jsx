import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { fetchUsNationalDebtPayload } from '../../services/usNationalDebtApi';
import {
  buildUsDebtRateCards,
  formatDateLabel,
  formatDateTimeLabel,
  formatNumberCompact,
  formatUsdCompact,
  formatUsdSigned,
  formatUsdWhole,
  getDebtPressureTone,
  projectCurrencyValue,
  projectSessionDelta,
  splitCurrencyGroups,
} from '../../utils/usNationalDebt';

const DATA_REFRESH_MS = 60_000;
const LIVE_TICK_MS = 1_000;

function getToneStyles(tone) {
  if (tone === 'pressure') {
    return {
      color: 'var(--accent-red)',
      borderColor: 'rgba(255, 71, 87, 0.18)',
      background: 'rgba(255, 71, 87, 0.08)',
    };
  }

  if (tone === 'relief') {
    return {
      color: 'var(--accent-green)',
      borderColor: 'rgba(0, 216, 151, 0.18)',
      background: 'rgba(0, 216, 151, 0.08)',
    };
  }

  return {
    color: 'var(--text-secondary)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.03)',
  };
}

function HeroFigure({ value }) {
  const groups = useMemo(() => splitCurrencyGroups(value), [value]);

  return (
    <div
      className="tabular-nums flex flex-wrap items-center justify-center gap-x-[0.16em] gap-y-1 font-mono font-semibold leading-[0.88] text-white"
      style={{
        fontSize: 'calc(var(--fs-display) * 1.06)',
        letterSpacing: '-0.08em',
      }}
    >
      {groups.map((group, index) => (
        <span key={`${group}-${index}`} className="whitespace-nowrap">
          {index < groups.length - 1 ? `${group},` : group}
        </span>
      ))}
    </div>
  );
}

function StatCard({ label, value, helper, accent = 'var(--text-primary)', featured = false }) {
  return (
    <article
      className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-left sm:p-5"
      style={{ boxShadow: featured ? '0 24px 60px rgba(0, 0, 0, 0.22)' : 'none' }}
    >
      <div
        className="font-mono uppercase"
        style={{
          color: featured ? 'var(--accent-bitcoin)' : 'var(--text-secondary)',
          fontSize: 'var(--fs-tag)',
          letterSpacing: '0.18em',
        }}
      >
        {label}
      </div>
      <div
        className="mt-3 font-mono font-semibold tabular-nums"
        style={{
          color: accent,
          fontSize: featured ? 'var(--fs-hero)' : 'var(--fs-title)',
          letterSpacing: '-0.05em',
          lineHeight: 0.95,
        }}
      >
        {value}
      </div>
      {helper ? (
        <div
          className="mt-3 font-mono leading-relaxed"
          style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-micro)' }}
        >
          {helper}
        </div>
      ) : null}
    </article>
  );
}

function RateCard({ label, value, toneColor }) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-white/[0.025] p-4 text-left sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: toneColor, opacity: 0.8 }} />
        <span
          className="font-mono uppercase"
          style={{
            color: 'var(--text-secondary)',
            fontSize: 'var(--fs-tag)',
            letterSpacing: '0.18em',
          }}
        >
          {label}
        </span>
      </div>
      <div
        className="font-mono font-semibold tabular-nums text-white"
        style={{ fontSize: 'var(--fs-title)', letterSpacing: '-0.04em', lineHeight: 0.95 }}
      >
        {value}
      </div>
      <div className="mt-2 font-mono" style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-micro)' }}>
        Projected pace
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center justify-center py-6 text-center sm:py-10 lg:min-h-full lg:py-0">
      <div className="skeleton h-6 w-56 rounded-full" />
      <div className="mt-5 flex w-full max-w-[980px] flex-wrap justify-center gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="skeleton h-16 w-40 rounded-2xl sm:h-20 sm:w-44 lg:h-24 lg:w-48" />
        ))}
      </div>
      <div className="skeleton mt-6 h-8 w-72 rounded-full sm:h-10 sm:w-96" />
      <div className="skeleton mt-3 h-4 w-64 rounded-full sm:w-72" />
      <div className="mt-8 grid w-full gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="skeleton min-h-[180px] rounded-[24px]" />
        ))}
      </div>
      <div className="mt-6 grid w-full gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="skeleton min-h-[128px] rounded-[22px]" />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-xl items-center justify-center py-8">
      <div className="w-full rounded-[28px] border border-white/10 bg-white/[0.03] px-6 py-8 text-center sm:px-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-[var(--accent-red)]">
          <AlertCircle size={20} />
        </div>
        <div className="mt-4 font-mono text-white" style={{ fontSize: 'var(--fs-section)' }}>
          Could not load official debt data
        </div>
        <div className="mt-2 font-mono leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-body)' }}>
          {message || 'The Treasury or Census endpoints are temporarily unavailable.'}
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 font-mono text-white transition hover:border-white/25 hover:bg-white/[0.08]"
          style={{ fontSize: 'var(--fs-caption)' }}
        >
          <RefreshCw size={14} />
          Retry
        </button>
      </div>
    </div>
  );
}

export default function S30_USNationalDebt() {
  const openedAtRef = useRef(Date.now());
  const hasPayloadRef = useRef(false);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  const load = useCallback(async ({ silent = false, force = false } = {}) => {
    if (silent) setRefreshing(true);
    if (!silent && !hasPayloadRef.current) setLoading(true);

    try {
      const nextPayload = await fetchUsNationalDebtPayload({ force });
      setPayload(nextPayload);
      hasPayloadRef.current = true;
      setError('');
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Could not load official debt data.';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load({ force: true });
    const refreshTimer = setInterval(() => {
      load({ silent: true, force: true });
    }, DATA_REFRESH_MS);
    return () => clearInterval(refreshTimer);
  }, [load]);

  useEffect(() => {
    const tick = setInterval(() => setNowMs(Date.now()), LIVE_TICK_MS);
    return () => clearInterval(tick);
  }, []);

  const model = payload?.data || null;
  const tone = useMemo(() => getDebtPressureTone(model?.rate_per_second), [model?.rate_per_second]);
  const toneStyles = useMemo(() => getToneStyles(tone), [tone]);
  const toneColor = toneStyles.color;
  const projectedTotal = useMemo(
    () => projectCurrencyValue(model?.total_debt, model?.rate_per_second, model?.projection_base_at || payload?.updated_at, nowMs),
    [model?.projection_base_at, model?.rate_per_second, model?.total_debt, nowMs, payload?.updated_at],
  );
  const sinceOpenDelta = useMemo(
    () => projectSessionDelta(model?.rate_per_second, openedAtRef.current, nowMs),
    [model?.rate_per_second, nowMs],
  );
  const rateCards = useMemo(() => buildUsDebtRateCards(model), [model]);
  const liveVerb = Number(model?.rate_per_second) < 0 ? 'reduced every second' : 'added every second';

  if (loading && !model) {
    return (
      <div className="relative flex h-full w-full overflow-y-auto bg-[var(--bg-primary)] px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <LoadingState />
      </div>
    );
  }

  if (!model) {
    return (
      <div className="relative flex h-full w-full overflow-y-auto bg-[var(--bg-primary)] px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
        <ErrorState message={error} onRetry={() => load({ force: true })} />
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full overflow-y-auto bg-[var(--bg-primary)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-[38vh]"
          style={{ background: 'radial-gradient(circle at top, rgba(247,147,26,0.08), transparent 58%)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[46vh]"
          style={{ background: 'radial-gradient(circle at bottom, rgba(255,71,87,0.10), transparent 56%)' }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1480px] flex-col px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8 xl:px-14 xl:py-10">
        <div className="mx-auto flex w-full max-w-[1240px] flex-1 flex-col items-center justify-center text-center">
          <header className="flex w-full max-w-[980px] flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span
                className="font-mono uppercase"
                style={{
                  color: 'var(--accent-bitcoin)',
                  fontSize: 'var(--fs-caption)',
                  letterSpacing: '0.28em',
                }}
              >
                UNITED STATES NATIONAL DEBT
              </span>
              <span className="hidden h-px w-10 bg-white/10 sm:block" />
              <span
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono uppercase"
                style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-tag)', letterSpacing: '0.18em' }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: 'var(--accent-red)', boxShadow: '0 0 12px rgba(255,71,87,0.5)' }}
                />
                REAL-TIME
              </span>
            </div>

            <div
              className="flex flex-wrap items-center justify-center gap-2 font-mono"
              style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-micro)' }}
            >
              <span>Official print {formatDateLabel(model.official_record_date)}</span>
              <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />
              <span>{model.interpolation_window_observations} observations in projection window</span>
              <span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" />
              <span>{refreshing ? 'Refreshing official cache' : `Synced ${formatDateTimeLabel(payload.updated_at)}`}</span>
            </div>
          </header>

          <section className="mt-7 w-full max-w-[1120px]">
            <HeroFigure value={projectedTotal} />
          </section>

          <section className="mt-6 flex w-full max-w-[920px] flex-col items-center gap-2">
            <div
              className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border px-4 py-2 font-mono tabular-nums"
              style={{
                color: toneStyles.color,
                borderColor: toneStyles.borderColor,
                background: toneStyles.background,
                fontSize: 'var(--fs-body)',
              }}
            >
              <span>{formatUsdSigned(sinceOpenDelta)}</span>
              <span style={{ color: 'var(--text-secondary)' }}>since you opened this page</span>
            </div>
            <div
              className="flex flex-wrap items-center justify-center gap-2 font-mono tabular-nums"
              style={{ fontSize: 'var(--fs-heading)', color: 'var(--text-primary)' }}
            >
              <span>{formatUsdWhole(Math.abs(Number(model.rate_per_second) || 0))}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{liveVerb}</span>
            </div>
          </section>

          <section className="mt-8 grid w-full gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
            <StatCard
              label="DEBT PER PERSON"
              value={formatUsdWhole(model.debt_per_person)}
              helper={`Estimated share of national debt per U.S. resident. Based on total national debt divided by the latest U.S. population estimate (${formatNumberCompact(model.population)} residents).`}
              accent="var(--text-primary)"
              featured
            />
            <StatCard
              label="DEBT HELD BY THE PUBLIC"
              value={formatUsdCompact(model.debt_held_public)}
              helper="Market-facing Treasury obligations held outside federal accounts."
              accent={toneColor}
            />
            <StatCard
              label="INTRAGOVERNMENTAL HOLDINGS"
              value={formatUsdCompact(model.intragovernmental_holdings)}
              helper="Treasury securities held by federal trust funds and government accounts."
              accent="var(--text-primary)"
            />
          </section>

          <section className="mt-8 w-full">
            <div
              className="mb-3 text-center font-mono uppercase"
              style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-tag)', letterSpacing: '0.22em' }}
            >
              RATE OF INCREASE
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {rateCards.map((card) => (
                <RateCard
                  key={card.label}
                  label={card.label}
                  value={Number(card.value) < 0 ? formatUsdSigned(card.value, { compact: true }) : formatUsdCompact(card.value)}
                  toneColor={toneColor}
                />
              ))}
            </div>
          </section>

          <footer className="mt-8 w-full rounded-[24px] border border-white/10 bg-black/25 px-4 py-4 text-left sm:px-5 sm:py-5">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <div className="font-mono uppercase" style={{ color: 'var(--accent-bitcoin)', fontSize: 'var(--fs-tag)', letterSpacing: '0.18em' }}>
                  Source
                </div>
                <div className="mt-2 font-mono leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-micro)' }}>
                  U.S. Treasury FiscalData Debt to the Penny and U.S. Census ACS 1-Year population estimate.
                </div>
              </div>

              <div>
                <div className="font-mono uppercase" style={{ color: 'var(--accent-bitcoin)', fontSize: 'var(--fs-tag)', letterSpacing: '0.18em' }}>
                  Methodology
                </div>
                <div className="mt-2 font-mono leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-micro)' }}>
                  {model.methodology?.interpolation || 'Projected real-time interpolation from recent official Treasury observations.'}
                </div>
              </div>

              <div>
                <div className="font-mono uppercase" style={{ color: 'var(--accent-bitcoin)', fontSize: 'var(--fs-tag)', letterSpacing: '0.18em' }}>
                  Update cadence
                </div>
                <div className="mt-2 font-mono leading-relaxed" style={{ color: 'var(--text-secondary)', fontSize: 'var(--fs-micro)' }}>
                  Official cache refreshes every 15 minutes. Counter motion updates each second in-session between official prints.
                </div>
              </div>
            </div>

            {(payload?.is_fallback || payload?.fallback_note || error) ? (
              <div
                className="mt-4 rounded-2xl border px-3 py-2 font-mono"
                style={{
                  color: 'var(--accent-warning)',
                  fontSize: 'var(--fs-micro)',
                  borderColor: 'rgba(255,215,0,0.18)',
                  background: 'rgba(255,215,0,0.06)',
                }}
              >
                {payload?.fallback_note || error}
              </div>
            ) : null}
          </footer>
        </div>
      </div>
    </div>
  );
}
