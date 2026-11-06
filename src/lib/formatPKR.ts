/**
 * Money formatting helper for Pakistan Rupee (PKR).
 * All monetary amounts in the API and state are integers in Paisa (1 PKR = 100 Paisa).
 * NEVER use floating point math for money.
 */

export function formatPKR(paisa: number): string {
  if (typeof paisa !== 'number' || isNaN(paisa)) {
    return 'Rs 0';
  }
  // Integer division to get rupees
  const rupees = Math.floor(Math.abs(paisa) / 100);
  const formatted = new Intl.NumberFormat('en-PK').format(rupees);
  const sign = paisa < 0 ? '-' : '';
  return `${sign}Rs ${formatted}`;
}

/**
 * Converts integer paisa to rupees integer/string for form inputs
 */
export function paisaToRupees(paisa: number): number {
  if (typeof paisa !== 'number' || isNaN(paisa)) return 0;
  return Math.floor(paisa / 100);
}

/**
 * Converts user-inputted rupees integer into integer paisa
 */
export function rupeesToPaisa(rupees: number | string): number {
  const parsed = typeof rupees === 'string' ? parseInt(rupees, 10) : Math.floor(rupees);
  if (isNaN(parsed) || parsed < 0) return 0;
  return parsed * 100;
}
