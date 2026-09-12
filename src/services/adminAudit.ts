import { supabase } from "@/integrations/supabase/client";

export interface AuditLogEntry {
  id: string;
  created_at: string;
  admin_email: string;
  action:
    | "IMPERSONATE_SALON"
    | "CHANGE_SALON_PLAN"
    | "UPDATE_SALON"
    | "CREATE_SALON"
    | "CONVERT_B2B_LEAD"
    | "SEND_PASSWORD_RESET"
    | "UPDATE_USER_ROLE"
    | "DELETE_REVIEW"
    | "DELETE_POST"
    | "DELETE_STORY"
    | "DELETE_TENANT"
    | "DELETE_LEAD"
    | "TOGGLE_MAINTENANCE"
    | "SAVE_ANNOUNCEMENT";
  target_type: "tenant" | "user" | "lead" | "review" | "post" | "story" | "system";
  target_id?: string;
  target_name?: string;
  details?: Record<string, any>;
}

const STORAGE_KEY = "glowapp_superadmin_audit_logs";

export const logSuperAdminAction = async (
  entry: Omit<AuditLogEntry, "id" | "created_at" | "admin_email">,
) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const adminEmail = session?.user?.email || "superadmin";

    const fullEntry: AuditLogEntry = {
      ...entry,
      id: "audit_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      created_at: new Date().toISOString(),
      admin_email: adminEmail,
    };

    // 1. Guardar en almacenamiento local persistente (hasta 300 logs)
    const stored = localStorage.getItem(STORAGE_KEY);
    const logs: AuditLogEntry[] = stored ? JSON.parse(stored) : [];
    logs.unshift(fullEntry);
    if (logs.length > 300) logs.pop();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

    // 2. Disparar evento para componentes en tiempo real
    window.dispatchEvent(new CustomEvent("glowapp:audit-log-created", { detail: fullEntry }));

    // 3. Intentar guardar en backend para persistencia compartida
    supabase
      .from("app_config")
      .upsert({
        key: `audit_${fullEntry.id}`,
        value: JSON.stringify(fullEntry),
      })
      .then(() => {})
      .catch(() => {});
  } catch (err) {
    console.warn("Could not record audit log:", err);
  }
};

export const getSuperAdminAuditLogs = (): AuditLogEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Logs iniciales de demostración si está vacío
      return [
        {
          id: "audit_init_1",
          created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          admin_email: "hugomunozfs@gmail.com",
          action: "IMPERSONATE_SALON",
          target_type: "tenant",
          target_name: "Cristina Muñoz",
          details: { slug: "cristina-munoz", mode: "1-click-access" },
        },
        {
          id: "audit_init_2",
          created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          admin_email: "hugomunozfs@gmail.com",
          action: "UPDATE_SALON",
          target_type: "tenant",
          target_name: "Montserrat Faig",
          details: { plan: "pro", active: true },
        },
      ];
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
};
