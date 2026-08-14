function escapeCsvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(headers: string[], rows: (string | number | null)[][]): string {
  const lines = [headers.map(escapeCsvField).join(",")];
  for (const row of rows) {
    lines.push(
      row.map((cell) => escapeCsvField(cell === null ? "" : String(cell))).join(","),
    );
  }
  return lines.join("\r\n") + "\r\n";
}
