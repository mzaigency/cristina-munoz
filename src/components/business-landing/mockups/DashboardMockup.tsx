import { CSSProperties } from "react";
import { Wallet, Calendar, UserPlus, TrendingUp, Clock, Globe, Building2, Plus, CheckCircle2, CreditCard, MessageCircle } from "lucide-react";

/**
 * Mockup del Inicio del panel PRO. Usa el MISMO markup y las MISMAS clases
 * `gp-*` que el AdminDashboard real (src/components/admin/AdminDashboard.tsx),
 * envuelto en `.gp-shell` para heredar exactamente los tokens del design
 * system → idéntico al panel real. Valores estáticos ilustrativos.
 */

const shellStyle: CSSProperties = {
  height: "auto",
  minHeight: 0,
  display: "block",
  overflow: "hidden",
  padding: "20px 22px",
};

function OccRing({ pct }: { pct: number }) {
  const size = 116, stroke = 12, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gp-chip)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--gp-accent)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.03em" }}>{Math.round(pct * 100)}%</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gp-muted-c)" }}>ocupación</span>
      </div>
    </div>
  );
}

const Delta = ({ v }: { v: number }) => (
  <span className={`gp-kpi-delta ${v >= 0 ? "up" : "down"}`}>
    <TrendingUp style={{ width: 11, height: 11, transform: v >= 0 ? undefined : "scaleY(-1)" }} />
    {v >= 0 ? "+" : ""}{v}%
  </span>
);

const QUICK = [
  { label: "Cobrar", icon: <CreditCard style={{ width: 18, height: 18 }} />, color: "#22408b" },
  { label: "Pedidos", icon: <Wallet style={{ width: 18, height: 18 }} />, color: "#99329a" },
  { label: "Lista de espera", icon: <Clock style={{ width: 18, height: 18 }} />, color: "#2563eb" },
  { label: "Mensajes", icon: <MessageCircle style={{ width: 18, height: 18 }} />, color: "#16a34a" },
];

export const DashboardMockup = () => {
  return (
    <div className="gp-shell" style={shellStyle}>
      <div className="gp-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Page header */}
        <div className="gp-page-h">
          <div>
            <h2>Resumen del día</h2>
            <p>martes 14 de junio · 2026</p>
          </div>
          <div className="gp-page-actions" style={{ display: "flex", gap: 8 }}>
            <button className="gp-btn"><TrendingUp style={{ width: 14, height: 14 }} /> Informes</button>
            <button className="gp-btn primary"><Plus style={{ width: 14, height: 14 }} /> Nueva cita</button>
          </div>
        </div>

        {/* Dashboard grid */}
        <div className="gp-dash">
          {/* Próxima cita */}
          <div className="gp-dash-next gp-card" style={{ overflow: "hidden", position: "relative" }}>
            <div className="gp-next-bg" />
            <div className="gp-next-inner">
              <div className="gp-next-text">
                <span className="gp-badge accent" style={{ marginBottom: 8, display: "inline-flex" }}>
                  <Clock style={{ width: 12, height: 12 }} /> Próxima cita
                </span>
                <div className="gp-next-row">
                  <span className="gp-next-time">17:30</span>
                  <div className="gp-next-meta">
                    <div className="gp-next-name">María López</div>
                    <div className="gp-next-sub">Corte + color · Cristina</div>
                  </div>
                </div>
                <div className="gp-next-actions">
                  <button className="gp-btn primary sm"><CheckCircle2 style={{ width: 13, height: 13 }} /> Registrar llegada</button>
                  <button className="gp-btn sm"><Calendar style={{ width: 13, height: 13 }} /> Ver agenda</button>
                </div>
              </div>
              <div className="gp-next-ring"><OccRing pct={0.76} /></div>
            </div>
          </div>

          {/* KPIs */}
          <div className="gp-dash-kpis">
            <div className="gp-kpi">
              <div className="gp-kpi-top">
                <span className="gp-kpi-ic" style={{ background: "var(--gp-accent-soft)", color: "var(--gp-accent)" }}><Wallet style={{ width: 16, height: 16 }} /></span>
                <Delta v={12} />
              </div>
              <div className="gp-kpi-val">420,00 €</div>
              <div className="gp-kpi-lbl">Ingresos de hoy</div>
            </div>
            <div className="gp-kpi">
              <div className="gp-kpi-top">
                <span className="gp-kpi-ic" style={{ background: "var(--gp-info-soft)", color: "var(--gp-info)" }}><Calendar style={{ width: 16, height: 16 }} /></span>
                <Delta v={5} />
              </div>
              <div className="gp-kpi-val">8</div>
              <div className="gp-kpi-lbl">Citas de hoy</div>
              <div className="gp-kpi-tags">
                <span className="gp-badge" style={{ background: "color-mix(in oklab, var(--gp-info), white 88%)", color: "var(--gp-info)" }}><Globe style={{ width: 10, height: 10 }} /> 5 web</span>
                <span className="gp-badge" style={{ background: "color-mix(in oklab, var(--gp-accent), white 88%)", color: "var(--gp-accent)" }}><Building2 style={{ width: 10, height: 10 }} /> 3 CRM</span>
              </div>
            </div>
            <div className="gp-kpi">
              <div className="gp-kpi-top">
                <span className="gp-kpi-ic" style={{ background: "var(--gp-ok-soft)", color: "var(--gp-ok)" }}><UserPlus style={{ width: 16, height: 16 }} /></span>
                <Delta v={50} />
              </div>
              <div className="gp-kpi-val">3</div>
              <div className="gp-kpi-lbl">Clientes nuevos</div>
            </div>
            <div className="gp-kpi">
              <div className="gp-kpi-top">
                <span className="gp-kpi-ic" style={{ background: "var(--gp-warn-soft)", color: "var(--gp-warn)" }}><TrendingUp style={{ width: 16, height: 16 }} /></span>
                <span className="gp-kpi-delta up"><TrendingUp style={{ width: 11, height: 11 }} />+8pp</span>
              </div>
              <div className="gp-kpi-val">76%</div>
              <div className="gp-kpi-lbl">Ocupación</div>
            </div>
          </div>

          {/* Atajos rápidos */}
          <div className="gp-dash-shortcuts gp-card" style={{ overflow: "hidden" }}>
            <div className="gp-card-h"><h3>Atajos rápidos</h3></div>
            <div className="gp-quick-grid">
              {QUICK.map((a) => (
                <button key={a.label} className="gp-quick-btn">
                  <span className="gp-quick-ic" style={{ background: `color-mix(in oklab, ${a.color}, white 86%)`, color: a.color }}>{a.icon}</span>
                  <span className="gp-quick-lbl">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
