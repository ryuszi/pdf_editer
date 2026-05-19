import { describe, expect, it } from "vitest";
import { parsePageRange } from "@/lib/pdf/pageRange";

describe("parsePageRange", () => {
  it("parses single and compound page ranges", () => {
    expect(parsePageRange("1", 20)).toEqual([1]);
    expect(parsePageRange("1,3,5", 20)).toEqual([1, 3, 5]);
    expect(parsePageRange("3-5", 20)).toEqual([3, 4, 5]);
    expect(parsePageRange("1,3-5,10", 20)).toEqual([1, 3, 4, 5, 10]);
  });

  it("deduplicates and sorts pages", () => {
    expect(parsePageRange("5,3,3,1-2", 10)).toEqual([1, 2, 3, 5]);
  });

  it("rejects invalid values", () => {
    expect(() => parsePageRange("0", 20)).toThrow();
    expect(() => parsePageRange("-1", 20)).toThrow();
    expect(() => parsePageRange("abc", 20)).toThrow();
    expect(() => parsePageRange("8-3", 20)).toThrow();
    expect(() => parsePageRange("21", 20)).toThrow();
  });
});
