import type { Client } from "./types";

export function exportClientsCsv(clients: Client[]) {
  const headers = ["Nombre", "Teléfono", "Email", "Visitas", "Gasto Total", "Última Visita", "Etiquetas", "Cumpleaños", "Notas"];
  const rows = clients.map(c => [
    c.name,
    c.phone || "",
    c.email || "",
    String(c.total_visits || 0),
    String((c.total_spent || 0).toFixed(2)),
    c.last_visit_at ? new Date(c.last_visit_at).toLocaleDateString("es-ES") : "",
    (c.tags || []).join(", "),
    c.birthday || "",
    (c.notes || "").replace(/\n/g, " "),
  ]);

  const csv = [headers, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `clientes_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
