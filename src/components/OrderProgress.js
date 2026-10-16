import Icon from './Icon';
import { ORDER_STATUS, STATUS_META, TRACK_STEPS } from '@/lib/constants';

const STEP_ICONS = {
  [ORDER_STATUS.PENDING]: 'clock',
  [ORDER_STATUS.PREPARING]: 'chef',
  [ORDER_STATUS.READY]: 'bag',
  [ORDER_STATUS.COMPLETED]: 'check',
};

/** Progress tracker horizontal untuk halaman status pesanan pelanggan. */
export default function OrderProgress({ status }) {
  const cancelled = status === ORDER_STATUS.CANCELLED;
  const currentStep = cancelled ? -1 : STATUS_META[status]?.step ?? 0;
  const pct =
    cancelled || currentStep < 0
      ? 0
      : (currentStep / (TRACK_STEPS.length - 1)) * 100;

  return (
    <div className="stack gap-3">
      <div style={{ position: 'relative', padding: '4px 0' }}>
        {/* garis latar */}
        <div
          style={{
            position: 'absolute',
            top: 22,
            left: '12%',
            right: '12%',
            height: 3,
            background: 'var(--line)',
            borderRadius: 999,
          }}
        />
        {/* garis progres */}
        <div
          style={{
            position: 'absolute',
            top: 22,
            left: '12%',
            width: `calc(${pct} * 0.76)`,
            height: 3,
            background: cancelled ? 'var(--danger)' : 'var(--brand)',
            borderRadius: 999,
            transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
          }}
        />

        <div className="row between" style={{ position: 'relative' }}>
          {TRACK_STEPS.map((step, i) => {
            const done = !cancelled && i <= currentStep;
            const isCurrent = !cancelled && i === currentStep;
            return (
              <div
                key={step}
                className="stack gap-1"
                style={{ alignItems: 'center', width: '24%' }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    background: done ? 'var(--brand)' : 'var(--surface)',
                    color: done ? '#fff' : 'var(--ink-3)',
                    border: `3px solid ${
                      done ? 'var(--brand)' : 'var(--line)'
                    }`,
                    transition: 'all 0.3s ease',
                    animation: isCurrent ? 'pulseRing 1.8s infinite' : 'none',
                  }}
                >
                  <Icon name={STEP_ICONS[step]} size={20} strokeWidth={2.4} />
                </div>
                <span
                  className="tiny"
                  style={{
                    fontWeight: isCurrent ? 750 : 600,
                    color: done ? 'var(--ink)' : 'var(--ink-3)',
                    textAlign: 'center',
                  }}
                >
                  {STATUS_META[step].short}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
