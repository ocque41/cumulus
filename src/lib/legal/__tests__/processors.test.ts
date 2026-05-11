import { describe, expect, it } from "vitest";

import processorsRaw from "@/content/legal/processors.json" assert { type: "json" };
import { processors } from "@/lib/legal/data";
import { processorsSchema } from "@/lib/legal/schema";

describe("processors schema", () => {
  it("parses the configured processors list", () => {
    const parsed = processorsSchema.parse(processorsRaw);
    expect(parsed).toEqual(processors);
  });

  it("rejects invalid processor entries", () => {
    expect(() =>
      processorsSchema.parse([
        {
          name: "Example",
          category: "Test",
          role: "Processor",
          dataTypes: ["data"],
          purpose: "Testing",
          docsUrl: "invalid-url",
          privacyUrl: "invalid-url",
        },
      ])
    ).toThrow();
  });
});
