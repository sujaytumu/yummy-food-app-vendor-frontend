import React, { useEffect, useRef, useState } from 'react';
import { API_URL } from '../data/apiPath';
import { authFetch } from '../data/authFetch';

const PERIODS = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
];
const STATUS_LABEL = {
  placed: 'Placed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
};

const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const compact = (n) => {
  if (n >= 100000) return '₹' + +(n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + +(n / 1000).toFixed(1) + 'K';
  return '₹' + Math.round(n);
};
const dayLabel = (iso) =>
  new Date(iso + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });

// Pick a clean tick step (1, 2, 2.5 or 5 x 10^k) giving at most 5 intervals, so ticks read 0 / 500 / 1K / 1.5K ...
const niceScale = (max) => {
  if (max <= 0) return { step: 25, count: 4 };
  for (let k = Math.floor(Math.log10(max / 5)) - 1; ; k++) {
    for (const m of [1, 2, 2.5, 5]) {
      const step = m * Math.pow(10, k);
      const count = Math.ceil(max / step);
      if (count <= 5) return { step, count: Math.max(count, 2) };
    }
  }
};

// Column with a 4px rounded top and a square baseline.
const columnPath = (x, y, w, base) => {
  const h = base - y;
  const r = Math.min(4, w / 2, h);
  return `M${x},${base} V${y + r} a${r},${r} 0 0 1 ${r},${-r} h${w - 2 * r} a${r},${r} 0 0 1 ${r},${r} V${base} Z`;
};

const Tile = ({ label, value }) => (
  <div className="anTile">
    <div className="anTileLabel">{label}</div>
    <div className="anTileValue">{value}</div>
  </div>
);

const RevenueChart = ({ daily }) => {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState(null); // index of the active column

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => setWidth(Math.max(280, Math.floor(el.clientWidth)));
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const H = 260;
  const m = { top: 18, right: 8, bottom: 30, left: 46 };
  const iw = width - m.left - m.right;
  const ih = H - m.top - m.bottom;
  const n = daily.length;
  const band = iw / n;
  const barW = Math.max(3, Math.min(24, band * 0.7));
  const maxVal = Math.max(...daily.map((d) => d.revenue), 0);
  const { step, count } = niceScale(maxVal);
  const top = step * count;
  const y = (v) => m.top + ih - (v / top) * ih;
  const base = m.top + ih;
  const ticks = Array.from({ length: count + 1 }, (_, i) => step * i);
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));
  const peak = maxVal > 0 ? daily.findIndex((d) => d.revenue === maxVal) : -1;

  const active = hover != null ? daily[hover] : null;
  const cx = (i) => m.left + band * i + band / 2;
  // keep the tooltip inside the chart
  const tipLeft = active ? Math.min(Math.max(cx(hover), 80), width - 80) : 0;

  return (
    <div className="anChartWrap" ref={wrapRef}>
      <svg
        width={width}
        height={H}
        role="img"
        aria-label={`Daily revenue for the last ${n} days. Use Show as table for exact values.`}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={m.left} x2={width - m.right} y1={y(t)} y2={y(t)} className="anGrid" />
            <text x={m.left - 8} y={y(t) + 4} textAnchor="end" className="anAxis">{compact(t)}</text>
          </g>
        ))}
        {daily.map((d, i) => (
          <g key={d.date}>
            {d.revenue > 0 && (
              <path
                d={columnPath(cx(i) - barW / 2, y(d.revenue), barW, base)}
                className={hover === i ? 'anBar anBarActive' : 'anBar'}
              />
            )}
            {i % every === 0 && i < n - 1 && n - 1 - i >= every / 2 && (
              <text x={cx(i)} y={H - 8} textAnchor="middle" className="anAxis">{dayLabel(d.date)}</text>
            )}
            {i === n - 1 && (
              <text x={cx(i)} y={H - 8} textAnchor="end" className="anAxis">{dayLabel(d.date)}</text>
            )}
            {/* hit area is the full column, wider and taller than the mark */}
            <rect
              x={m.left + band * i}
              y={m.top}
              width={band}
              height={ih}
              fill="transparent"
              tabIndex={0}
              aria-label={`${dayLabel(d.date)}: ${inr(d.revenue)} from ${d.orders} order${d.orders === 1 ? '' : 's'}`}
              onPointerEnter={() => setHover(i)}
              onPointerDown={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
            />
          </g>
        ))}
        {peak >= 0 && hover == null && (
          <text
            x={Math.min(Math.max(cx(peak), m.left + 16), width - m.right - 16)}
            y={y(maxVal) - 6}
            textAnchor="middle"
            className="anPeak"
          >
            {compact(maxVal)}
          </text>
        )}
      </svg>
      {active && (
        <div className="anTip" style={{ left: tipLeft }}>
          <strong>{inr(active.revenue)}</strong>
          <span>{dayLabel(active.date)} · {active.orders} order{active.orders === 1 ? '' : 's'}</span>
        </div>
      )}
    </div>
  );
};

const TopItems = ({ items }) => {
  const max = Math.max(...items.map((i) => i.qty), 1);
  const [hover, setHover] = useState(null);
  return (
    <div className="anTop">
      {items.map((it, i) => (
        <div
          className="anTopRow"
          key={it.name + i}
          tabIndex={0}
          onPointerEnter={() => setHover(i)}
          onPointerLeave={() => setHover(null)}
          onFocus={() => setHover(i)}
          onBlur={() => setHover(null)}
          aria-label={`${it.name}: ${it.qty} sold, ${inr(it.revenue)}`}
        >
          <div className="anTopName">{it.name}</div>
          <div className="anTopTrack">
            <div className={hover === i ? 'anTopBar anBarActive' : 'anTopBar'} style={{ width: `${(it.qty / max) * 100}%` }} />
          </div>
          <div className="anTopQty">{it.qty}</div>
          {hover === i && <div className="anTopTip">{inr(it.revenue)} revenue</div>}
        </div>
      ))}
    </div>
  );
};

const Analytics = () => {
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [asTable, setAsTable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    (async () => {
      try {
        const res = await authFetch(`${API_URL}/payment/vendor-analytics?days=${days}`);
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(res.status === 403 ? 'Session expired, please logout and login again' : body.error || 'Failed to load analytics');
        }
        if (!cancelled) setData(body);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days]);

  const t = data?.totals;

  return (
    <div className="productSection anSection">
      <div className="anHead">
        <h3>Sales analytics</h3>
        <div className="anPeriods" role="group" aria-label="Period">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              className={days === p.days ? 'anPeriod active' : 'anPeriod'}
              onClick={() => setDays(p.days)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p>{error}</p>}
      {loading && !data && <p>Loading...</p>}

      {data && (
        <div className={loading ? 'anBody anLoading' : 'anBody'}>
          <div className="anTiles">
            <Tile label="Revenue" value={inr(t.revenue)} />
            <Tile label="Orders" value={t.orders} />
            <Tile label="Average order" value={inr(t.avgOrderValue)} />
            <Tile label="Items sold" value={t.itemsSold} />
          </div>

          {t.orders === 0 ? (
            <p className="anEmpty">No paid orders in the last {data.days} days.</p>
          ) : (
            <>
              <div className="anCard">
                <div className="anCardHead">
                  <h4>Revenue per day</h4>
                  <button type="button" className="statusAdvanceBtn" onClick={() => setAsTable((v) => !v)}>
                    {asTable ? 'Show chart' : 'Show as table'}
                  </button>
                </div>
                {asTable ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="product-table" style={{ width: '100%' }}>
                      <thead>
                        <tr><th>Date</th><th>Orders</th><th>Revenue</th></tr>
                      </thead>
                      <tbody>
                        {[...data.daily].reverse().map((d) => (
                          <tr key={d.date}>
                            <td>{dayLabel(d.date)}</td>
                            <td>{d.orders}</td>
                            <td>{inr(d.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <RevenueChart daily={data.daily} />
                )}
              </div>

              <div className="anCard">
                <h4>Best sellers <span className="anSub">by quantity sold</span></h4>
                <TopItems items={data.topItems} />
              </div>

              <div className="anCard">
                <h4>Orders by status</h4>
                <div className="anStatuses">
                  {Object.entries(STATUS_LABEL).map(([k, label]) => (
                    <div key={k} className="anStatus">
                      <span className={`statusPill status-${k}`}>{label}</span>
                      <strong>{data.statusCounts[k] || 0}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
