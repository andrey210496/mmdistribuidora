// ============================================================
// Validação de CPF — dígito verificador (anti-fraude).
// O backend NUNCA confia que o CPF enviado é válido: revalida aqui.
// ============================================================

/** Remove tudo que não for dígito. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Valida um CPF pelos dois dígitos verificadores. */
export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;

  // Rejeita sequências repetidas (000..., 111..., etc) — passam no cálculo mas são inválidas
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  // Primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += digits[i]! * (10 - i);
  let check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== digits[9]) return false;

  // Segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) sum += digits[i]! * (11 - i);
  check = (sum * 10) % 11;
  if (check === 10) check = 0;
  if (check !== digits[10]) return false;

  return true;
}

/** Formata para exibição: 123.456.789-09 */
export function formatCpf(value: string): string {
  const cpf = onlyDigits(value).slice(0, 11);
  return cpf
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
