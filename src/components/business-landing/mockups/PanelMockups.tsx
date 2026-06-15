import { CSSProperties } from "react";
import { Search, Plus, Download, Filter, Star, TrendingUp, Wallet, CreditCard, Calendar } from "lucide-react";

/**
 * Mockups de las secciones del panel PRO (Agenda, Caja, Clientes, Informes).
 * Todos envueltos en `.gp-shell` y usando las clases reales `gp-*` del design
 * system → heredan exactamente tokens, sombras, radios y tipografía del panel
 * real. Valores estáticos ilustrativos.
 */

const shellStyle: CSSProperties = {
  height: "auto",
  minHeight: 0,
  display: "block",
  overflow: "hidden",
  padding: "20px 22px",
};

function Head({ title, action, icon }: { title: string; action: string; icon: JSX.Element }) {
  return (
    <div className="gp-page-h">
      <div><h2>{title}</h2></div>
      <div className="gp-page-actions" style={{ display: "flex", gap: 8 }}>
        <button className="gp-btn primary">{icon} {action}</button>
      </div>
    </div>
  );
}

/* ---------- AGENDA ---------- */
const STYLISTS = [
  { name: "Cristina", color: "var(--gp-accent)" },
  { name: "Lucía", color: "var(--gp-purple)" },
  { name: "Marta", color: "var(--gp-info)" },
];
const APPTS = [
  { col: 0, top: 6, h: 60, name: "María L.", svc: "Corte + color" },
  { col: 0, top: 80, h: 34, name: "Ana P.", svc: "Peinado" },
  { col: 1, top: 26, h: 46, name: "Carmen", svc: "Mechas" },
  { col: 1, top: 100, h: 44, name: "Sofía", svc: "Manicura" },
  { col: 2, top: 6, h: 40, name: "Laura", svc: "Tinte" },
  { col: 2, top: 62, h: 70, name: "Elena", svc: "Balayage" },
];

export const AgendaMockup = () => (
  <div className="gp-shell" style={shellStyle}>
    <div className="gp-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Head title="Agenda" action="Nueva cita" icon={<Plus style={{ width: 14, height: 14 }} />} />
      <div className="gp-card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "36px repeat(3, 1fr)", borderBottom: "1px solid var(--gp-line)" }}>
          <div />
          {STYLISTS.map((s) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 7, padding: "11px 12px", borderLeft: "1px solid var(--gp-line)" }}>
              <span style={{ width: 9, height: 9, borderRadius: 99, background: s.color }} />
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--gp-ink)" }}>{s.name}</span>
            </div>
          ))}
        </div>
        <div style={{ position: "relative", display: "grid", gridTemplateColumns: "36px repeat(3, 1fr)", height: 200 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "4px 0" }}>
            {["10", "11", "12", "13"].map((h) => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: "var(--gp-muted-c)", textAlign: "center" }}>{h}</span>
            ))}
          </div>
          {STYLISTS.map((s, ci) => (
            <div key={s.name} style={{ position: "relative", borderLeft: "1px solid var(--gp-line)" }}>
              {[0, 1, 2, 3].map((g) => <div key={g} style={{ height: "25%", borderBottom: "1px dashed var(--gp-line)" }} />)}
              {APPTS.filter((a) => a.col === ci).map((a, i) => (
                <div key={i} style={{ position: "absolute", left: 5, right: 5, top: a.top, height: a.h, borderRadius: 9, padding: "5px 8px", overflow: "hidden", background: `color-mix(in oklab, ${s.color}, white 86%)`, borderLeft: `3px solid ${s.color}` }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{a.name}</div>
                  <div style={{ fontSize: 10, color: "var(--gp-ink2)" }}>{a.svc}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ---------- CAJA ---------- */
const TX = [
  { n: "María López", s: "Corte + color", v: "45,00 €", m: "Tarjeta" },
  { n: "Ana Pérez", s: "Peinado", v: "20,00 €", m: "Efectivo" },
  { n: "Carmen R.", s: "Mechas", v: "60,00 €", m: "Tarjeta" },
  { n: "Sofía G.", s: "Manicura", v: "18,00 €", m: "Bizum" },
];

export const CajaMockup = () => (
  <div className="gp-shell" style={shellStyle}>
    <div className="gp-fade" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Head title="Caja" action="Cobrar" icon={<CreditCard style={{ width: 14, height: 14 }} />} />
      <div className="gp-dash-kpis" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { l: "Efectivo", v: "150,00 €", ic: <Wallet style={{ width: 16, height: 16 }} />, bg: "var(--gp-ok-soft)", c: "var(--gp-ok)" },
          { l: "Tarjeta", v: "245,00 €", ic: <CreditCard style={{ width: 16, height: 16 }} />, bg: "var(--gp-accent-soft)", c: "var(--gp-accent)" },
          { l: "Total hoy", v: "420,00 €", ic: <TrendingUp style={{ width: 16, height: 16 }} />, bg: "color-mix(in oklab, var(--gp-purple), white 88%)", c: "var(--gp-purple)" },
        ].map((k) => (
          <div key={k.l} className="gp-kpi">
            <div className="gp-kpi-top">
              <span className="gp-kpi-ic" style={{ background: k.bg, color: k.c }}>{k.ic}</span>
            </div>
            <div className="gp-kpi-val">{k.v}</div>
            <div className="gp-kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>
      <div className="gp-card" style={{ overflow: "hidden" }}>
        <div className="gp-card-h"><h3>Movimientos de hoy</h3></div>
        <div>
          {TX.map((t) => (
            <div key={t.n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", borderBottom: "1px solid var(--gp-line2)" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "linear-gradient(135deg, var(--gp-accent), var(--gp-purple))", flex: "none" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--gp-ink)" }}>{t.n}</div>
                <div style={{ fontSize: 11.5, color: "var(--gp-muted-c)", fontWeight: 600 }}>{t.s}</div>
              </div>
              <span className="gp-badge">{t.m}</span>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--gp-ink)", fontVariantNumeric: "tabular-nums" }}>{t.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ---------- CLIENTES ---------- */
const CLIENTS = [
  { n: "María López", p: "612 345 678", v: 14, s: "1.240 €", t: "VIP" },
  { n: "Carmen Ruiz", p: "655 112 233", v: 9, s: "780 €", t: "Fiel" },
  { n: "Ana Pérez", p: "699 887 766", v: 6, s: "420 €", t: "" },
  { n: "Sofía Gil", p: "611 223 344", v: 3, s: "180 €", t: "Nueva" },
];

export const ClientesMockup = () => (
  <div className="gp-shell" style={shellStyle}>
    <div className="gp-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Head title="Clientes" action="Nuevo cliente" icon={<Plus style={{ width: 14, height: 14 }} />} />
      <div style={{ display: "flex", gap: 8 }}>
        <div className="gp-card" style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "9px 13px" }}>
          <Search style={{ width: 15, height: 15, color: "var(--gp-muted-c)" }} />
          <span style={{ fontSize: 12.5, color: "var(--gp-muted-c)", fontWeight: 600 }}>Buscar por nombre o teléfono…</span>
        </div>
        <button className="gp-btn"><Filter style={{ width: 14, height: 14 }} /> Filtrar</button>
        <button className="gp-btn"><Download style={{ width: 14, height: 14 }} /> CSV</button>
      </div>
      <div className="gp-card" style={{ overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.3fr 0.7fr 1fr", padding: "10px 16px", fontSize: 10.5, fontWeight: 800, color: "var(--gp-muted-c)", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid var(--gp-line)" }}>
          <span>Cliente</span><span>Teléfono</span><span>Visitas</span><span style={{ textAlign: "right" }}>Gastado</span>
        </div>
        {CLIENTS.map((c) => (
          <div key={c.n} style={{ display: "grid", gridTemplateColumns: "2fr 1.3fr 0.7fr 1fr", alignItems: "center", padding: "11px 16px", borderBottom: "1px solid var(--gp-line2)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 99, background: "linear-gradient(135deg, var(--gp-accent), var(--gp-purple))", color: "#fff", fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {c.n.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gp-ink)", display: "flex", alignItems: "center", gap: 7 }}>
                {c.n}
                {c.t && <span className="gp-badge accent">{c.t}</span>}
              </div>
            </div>
            <span style={{ fontSize: 12.5, color: "var(--gp-ink2)", fontWeight: 600 }}>{c.p}</span>
            <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--gp-ink)" }}>{c.v}</span>
            <span style={{ fontSize: 13.5, fontWeight: 800, textAlign: "right", color: "var(--gp-ink)", fontVariantNumeric: "tabular-nums" }}>{c.s}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ---------- INFORMES ---------- */
const BARS = [40, 62, 48, 75, 95, 70, 84];
const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const TOPSVC = [
  { n: "Color completo", v: "1.320 €", w: "100%" },
  { n: "Corte + peinado", v: "980 €", w: "74%" },
  { n: "Mechas", v: "760 €", w: "58%" },
];

export const AnalyticsMockup = () => (
  <div className="gp-shell" style={shellStyle}>
    <div className="gp-fade" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Head title="Informes" action="Exportar" icon={<Download style={{ width: 14, height: 14 }} />} />
      <div className="gp-dash-kpis" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {[
          { l: "Ingresos mes", v: "8.420 €", d: 18, ic: <Wallet style={{ width: 16, height: 16 }} /> },
          { l: "Citas mes", v: "214", d: 9, ic: <Calendar style={{ width: 16, height: 16 }} /> },
          { l: "Ticket medio", v: "39 €", d: 4, ic: <TrendingUp style={{ width: 16, height: 16 }} /> },
        ].map((k) => (
          <div key={k.l} className="gp-kpi">
            <div className="gp-kpi-top">
              <span className="gp-kpi-ic" style={{ background: "var(--gp-accent-soft)", color: "var(--gp-accent)" }}>{k.ic}</span>
              <span className="gp-kpi-delta up"><TrendingUp style={{ width: 11, height: 11 }} />+{k.d}%</span>
            </div>
            <div className="gp-kpi-val">{k.v}</div>
            <div className="gp-kpi-lbl">{k.l}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 14 }}>
        <div className="gp-card" style={{ padding: 16, display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--gp-ink)", marginBottom: 8 }}>Ingresos esta semana</div>
          <div style={{ height: 150, display: "flex", alignItems: "flex-end", gap: 10 }}>
            {BARS.map((b, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ width: "100%", height: `${b}%`, borderRadius: "7px 7px 0 0", background: i === 4 ? "linear-gradient(var(--gp-accent), var(--gp-purple))" : "color-mix(in oklab, var(--gp-accent), white 78%)" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "var(--gp-muted-c)" }}>{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="gp-card" style={{ padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--gp-ink)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
            <Star style={{ width: 14, height: 14, color: "var(--gp-warn)" }} /> Servicios top
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {TOPSVC.map((s) => (
              <div key={s.n}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                  <span style={{ color: "var(--gp-ink2)", fontWeight: 600 }}>{s.n}</span>
                  <span style={{ fontWeight: 800, color: "var(--gp-ink)" }}>{s.v}</span>
                </div>
                <div style={{ height: 7, borderRadius: 99, background: "var(--gp-chip)" }}>
                  <div style={{ height: "100%", width: s.w, borderRadius: 99, background: "linear-gradient(90deg, var(--gp-accent), var(--gp-purple))" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);
