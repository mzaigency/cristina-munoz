import React from "react";
import { DemoFactory } from "@/components/superadmin/DemoFactory";

export const DemoFactorySection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Fábrica de Demos (Sandbox de Ventas)
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Genera salones de demostración completos en 1 clic (con servicios, estilistas y reservas ficticias) para visitas de venta o pruebas técnicas.
        </p>
      </div>

      <DemoFactory />
    </div>
  );
};
