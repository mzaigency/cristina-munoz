import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GlowModal } from "../layout/GlowModal";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileUp, CheckCircle2, AlertTriangle, Loader2, Users } from "lucide-react";
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

  const close = () => { reset(); onOpenChange(false); };

  // El pie cambia según el paso: nada que hacer hasta que hay un CSV cargado.
  const footer =
    done !== null ? (
      <button className="glow-btn glow-btn--grow" onClick={close}>Cerrar</button>
    ) : rows.length === 0 && !fileName ? undefined : (
      <>
        <button className="glow-btn" onClick={reset} disabled={importing}>Cambiar archivo</button>
        <button
          className="glow-btn glow-btn--primary"
          onClick={handleImport}
          disabled={rows.length === 0 || importing}
        >
          {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Importar {rows.length} clientes
        </button>
      </>
    );

  return (
    <GlowModal
      open={open}
      onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}
      title="Importar clientes"
      description="Desde Booksy, Fresha, Treatwell o cualquier CSV."
      icon={<Users />}
      footer={footer}
    >
      <div className="glow-form">
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />

        {done !== null ? (
          <div className="glow-empty">
            <span className="glow-empty-ic !bg-glow-ok-soft !text-glow-ok-ink">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <h4>{done} clientes importados</h4>
            <p>Los encontrarás con la etiqueta "Importado".</p>
          </div>
        ) : rows.length === 0 && !fileName ? (
          <>
            <p className="text-[13.5px] font-medium leading-relaxed text-outline">
              En Booksy: Clientes → Exportar lista de clientes. Detectamos las columnas
              solos y omitimos los que ya tienes.
            </p>
            <button
              onClick={() => inputRef.current?.click()}
              className="flex flex-col items-center gap-2 rounded-[18px] border-2 border-dashed border-line p-8 text-center transition-colors active:bg-chip min-[920px]:hover:border-glow-brand/40 min-[920px]:hover:bg-chip"
            >
              <FileUp className="h-7 w-7 text-outline" />
              <span className="text-[14px] font-bold text-on-surface">Selecciona el archivo CSV</span>
              <span className="text-[12.5px] font-medium text-outline">
                o arrástralo aquí desde tu ordenador
              </span>
            </button>
          </>
        ) : (
          <>
            <div className="rounded-[18px] border border-line p-4">
              <p className="truncate text-[14px] font-extrabold text-on-surface">{fileName}</p>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-semibold">
                <span className="text-glow-ok-ink">{rows.length} nuevos para importar</span>
                {duplicates > 0 && <span className="text-outline">{duplicates} ya existentes (se omiten)</span>}
                {skipped > 0 && (
                  <span className="inline-flex items-center gap-1 text-glow-warn-ink">
                    <AlertTriangle className="h-3.5 w-3.5" /> {skipped} sin nombre (se omiten)
                  </span>
                )}
              </div>
            </div>

            {/* Vista previa como filas, no como tabla: tres columnas no caben en
                un móvil y obligaban a hacer scroll lateral dentro de la hoja. */}
            {rows.length > 0 && (
              <div className="overflow-hidden rounded-[18px] border border-line">
                {rows.slice(0, 30).map((r, i) => (
                  <div key={i} className="border-b border-line-soft px-3.5 py-2.5 last:border-b-0">
                    <p className="truncate text-[13.5px] font-bold text-on-surface">{r.name}</p>
                    <p className="truncate text-[12.5px] font-medium text-outline">
                      {[r.phone, r.email].filter(Boolean).join(" · ") || "Sin teléfono ni email"}
                    </p>
                  </div>
                ))}
                {rows.length > 30 && (
                  <p className="border-t border-line-soft py-2 text-center text-[12.5px] font-semibold text-outline">
                    … y {rows.length - 30} más
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </GlowModal>
  );
}
