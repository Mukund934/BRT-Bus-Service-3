import { describe, it, expect } from "vitest";

describe("test harness", () => {
  it("boots with jest-dom matchers registered", () => {
    const el = document.createElement("div");
    el.textContent = "brt";
    document.body.appendChild(el);
    expect(el).toBeInTheDocument();
  });
});
