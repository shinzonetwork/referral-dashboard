import { describe, expect, it } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("joins headers and rows with CRLF", () => {
    const csv = toCsv(["a", "b"], [["1", "2"]]);
    expect(csv).toBe("a,b\r\n1,2\r\n");
  });

  it("escapes fields containing commas, quotes, or newlines", () => {
    const csv = toCsv(["note"], [['contains, a comma']]);
    expect(csv).toContain('"contains, a comma"');

    const withQuote = toCsv(["note"], [['say "hi"']]);
    expect(withQuote).toContain('"say ""hi"""');

    const withNewline = toCsv(["note"], [["line1\nline2"]]);
    expect(withNewline).toContain('"line1\nline2"');
  });

  it("renders null cells as empty strings", () => {
    const csv = toCsv(["a"], [[null]]);
    expect(csv).toBe("a\r\n\r\n");
  });
});
