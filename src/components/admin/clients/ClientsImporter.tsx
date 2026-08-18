import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileUp, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import type { Client } from "./types";
import { parseCsv, findCol, parseBirthday, normPhone, normEmail, type ParsedRow } from "./importCsv";

interface ClientsImporterProps {
  tenantId: string;
  existingClients: Client[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}

export function ClientsImporter({ tenantId, existingClients, open, onOpenChange, onImported }: ClientsImporterProps) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [duplicates, setDuplicates] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const reset = () => {
    setRows([]); setDuplicates(0); setSkipped(0); setFileName(""); setDone(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    setDone(null);
    const text = await file.text();
    const parsed = parseCsv(text);
    if (parsed.length < 2) {
      toast({ title: "Archivo vacío", description: "El CSV no tiene filas de datos", variant: "destructive" });
      return;
    }

    const headers = parsed[0];
    const iFirst = findCol(headers, ["first name", "nombre", "name", "client name", "nombre del cliente"]);
    const iLast = findCol(headers, ["last name", "apellidos", "apellido", "surname"]);
    const iPhone = findCol(headers, ["mobile", "movil", "telefono", "phone", "tel", "mobile number", "numero de telefono"]);
    const iEmail = findCol(headers, ["email", "e-mail", "correo", "correo electronico"]);
    const iNotes = findCol(headers, ["notes", "notas", "nota", "comentarios"]);
    const iBday = findCol(headers, ["birthday", "fecha de nacimiento", "cumpleanos", "date of birth", "birth date"]);

    if (iFirst === -1) {
      toast({
        title: "No reconozco las columnas",
        description: "El CSV necesita al menos una columna de nombre (Nombre / First name / Name)",
        variant: "destructive",
      });
      return;
    }

    const phoneSet = new Set(existingClients.map(c => normPhone(c.phone)).filter(Boolean));
    const emailSet = new Set(existingClients.map(c => normEmail(c.email)).filter(Boolean));
    const seenInFile = new Set<string>();

    const out: ParsedRow[] = [];
    let dups = 0;
    let bad = 0;

    for (const r of parsed.slice(1)) {
      const first = (r[iFirst] || "").trim();
      const last = iLast !== -1 ? (r[iLast] || "").trim() : "";
      const name = [first, last].filter(Boolean).join(" ");
      if (!name) { bad++; continue; }

      const phone = iPhone !== -1 ? (r[iPhone] || "").trim() || null : null;
      const email = iEmail !== -1 ? (r[iEmail] || "").trim() || null : null;

      const pKey = normPhone(phone);
      const eKey = normEmail(email);
      const fileKey = pKey || eKey || name.toLowerCase();
      if ((pKey && phoneSet.has(pKey)) || (eKey && emailSet.has(eKey)) || seenInFile.has(fileKey)) {
        dups++;
        continue;
      }
      seenInFile.add(fileKey);

      out.push({
        name,
        phone,
        email,
        notes: iNotes !== -1 ? (r[iNotes] || "").trim() || null : null,
        birthday: iBday !== -1 ? parseBirthday(r[iBday] || "") : null,
      });
    }

    setRows(out);
    setDuplicates(dups);
    setSkipped(bad);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    try {
      const BATCH = 100;
      let inserted = 0;
      for (let i = 0; i < rows.length; i += BATCH) {
        const batch = rows.slice(i, i + BATCH).map(r => ({
          tenant_id: tenantId,
          name: r.name,
          phone: r.phone,
          email: r.email,
          notes: r.notes,
          birthday: r.birthday,
          tags: ["Importado"],
        }));
        const { error } = await supabase.from("clients" as any).insert(batch);
        if (error) throw error;
        inserted += batch.length;
      }
      setDone(inserted);
      toast({ title: "Importación completada", description: `${inserted} clientes añadidos a tu CRM` });
      onImported();
    } catch (error) {
      console.error("Error importing clients:", error);
      toast({ title: "Error al importar", description: "No se pudieron guardar los clientes. Inténtalo de nuevo.", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar clientes desde CSV</DialogTitle>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          Trae tus clientes de Booksy, Fresha, Treatwell o cualquier CSV. En Booksy:
          Clientes → Exportar lista de clientes. Detectamos las columnas solos y
          omitimos los que ya tienes.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {done !== null ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[var(--gp-ok)] bg-[var(--gp-ok-soft)] p-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-[var(--gp-ok)]" />
            <p className="font-semibold">{done} clientes importados</p>
            <p className="text-sm text-muted-foreground">Los encontrarás con la etiqueta "Importado"</p>
            <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cerrar</Button>
          </div>
        ) : rows.length === 0 && !fileName ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/40"
          >
            <FileUp className="h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">Selecciona el archivo CSV</span>
            <span className="text-xs text-muted-foreground">o arrástralo aquí desde tu ordenador</span>
          </button>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border p-4">
              <p className="text-sm font-semibold">{fileName}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="font-medium text-[var(--gp-ok-ink)]">{rows.length} nuevos para importar</span>
                {duplicates > 0 && <span className="text-muted-foreground">{duplicates} ya existentes (se omiten)</span>}
                {skipped > 0 && (
                  <span className="inline-flex items-center gap-1 text-[var(--gp-warn-ink)]">
                    <AlertTriangle className="h-3.5 w-3.5" /> {skipped} sin nombre (se omiten)
                  </span>
                )}
              </div>
            </div>

            {rows.length > 0 && (
              <div className="max-h-44 overflow-y-auto rounded-xl border border-border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-medium">Nombre</th>
                      <th className="px-3 py-2 font-medium">Teléfono</th>
                      <th className="px-3 py-2 font-medium">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 30).map((r, i) => (
                      <tr key={i} className="border-t border-border/60">
                        <td className="px-3 py-1.5">{r.name}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{r.phone || "—"}</td>
                        <td className="px-3 py-1.5 text-muted-foreground">{r.email || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 30 && (
                  <p className="border-t border-border/60 px-3 py-1.5 text-center text-xs text-muted-foreground">
                    … y {rows.length - 30} más
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset} disabled={importing}>Cambiar archivo</Button>
              <Button onClick={handleImport} disabled={rows.length === 0 || importing}>
                {importing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Importar {rows.length} clientes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
