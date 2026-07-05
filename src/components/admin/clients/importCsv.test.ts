import { describe, it, expect } from "vitest";
import { parseCsv, findCol, parseBirthday, normPhone, normEmail } from "./importCsv";

describe("parseCsv", () => {
  it("parsea CSV simple con comas", () => {
    const rows = parseCsv("a,b,c\n1,2,3");
    expect(rows).toEqual([["a", "b", "c"], ["1", "2", "3"]]);
  });

  it("detecta separador punto y coma (export Booksy España)", () => {
    const rows = parseCsv("Nombre;Teléfono;Email\nAna;600111222;ana@mail.com");
    expect(rows).toEqual([
      ["Nombre", "Teléfono", "Email"],
      ["Ana", "600111222", "ana@mail.com"],
    ]);
  });

  it("respeta comillas con separadores y saltos de línea dentro", () => {
    const rows = parseCsv('name,notes\nAna,"le gusta, el rubio\nceniza"');
    expect(rows).toEqual([["name", "notes"], ["Ana", "le gusta, el rubio\nceniza"]]);
  });

  it("descomilla comillas dobles escapadas", () => {
    const rows = parseCsv('a,b\n"dijo ""hola""",x');
    expect(rows[1][0]).toBe('dijo "hola"');
  });

  it("ignora filas vacías y CRLF", () => {
    const rows = parseCsv("a,b\r\n1,2\r\n\r\n");
    expect(rows).toEqual([["a", "b"], ["1", "2"]]);
  });
});

describe("findCol", () => {
  it("encuentra headers de Booksy en inglés", () => {
    const headers = ["First name", "Last name", "Mobile", "E-mail"];
    expect(findCol(headers, ["first name", "nombre"])).toBe(0);
    expect(findCol(headers, ["mobile", "telefono"])).toBe(2);
    expect(findCol(headers, ["email", "e-mail"])).toBe(3);
  });

  it("encuentra headers en español ignorando acentos", () => {
    const headers = ["Nombre", "Apellidos", "Teléfono", "Correo electrónico"];
    expect(findCol(headers, ["telefono", "phone"])).toBe(2);
    expect(findCol(headers, ["correo electronico", "email"])).toBe(3);
  });

  it("devuelve -1 si no hay match", () => {
    expect(findCol(["x", "y"], ["email"])).toBe(-1);
  });
});

describe("parseBirthday", () => {
  it("acepta ISO", () => {
    expect(parseBirthday("1990-05-19")).toBe("1990-05-19");
  });
  it("convierte DD/MM/YYYY", () => {
    expect(parseBirthday("19/5/1990")).toBe("1990-05-19");
    expect(parseBirthday("01.12.1985")).toBe("1985-12-01");
  });
  it("devuelve null para basura", () => {
    expect(parseBirthday("")).toBeNull();
    expect(parseBirthday("ayer")).toBeNull();
  });
});

describe("normalización para dedupe", () => {
  it("teléfonos: solo dígitos, sin prefijo 34", () => {
    expect(normPhone("+34 600 11 22 33")).toBe("600112233");
    expect(normPhone("600-11-22-33")).toBe("600112233");
    expect(normPhone(null)).toBe("");
  });
  it("emails: minúsculas y sin espacios", () => {
    expect(normEmail("  Ana@Mail.COM ")).toBe("ana@mail.com");
    expect(normEmail(null)).toBe("");
  });
});
