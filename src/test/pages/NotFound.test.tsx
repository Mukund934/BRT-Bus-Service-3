import { describe, expect, it, vi } from "vitest";
import NotFound from "@/pages/NotFound";
import { renderWithProviders, screen } from "../helpers/render";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

describe("landing on a page that does not exist", () => {
  it("says so plainly", () => {
    renderWithProviders(<NotFound />, { route: "/nowhere" });

    expect(
      screen.getByRole("heading", { name: "Page not found" })
    ).toBeInTheDocument();
  });

  it("offers a way back into the site", () => {
    renderWithProviders(<NotFound />, { route: "/nowhere" });

    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute(
      "href",
      "/"
    );
    expect(screen.getByRole("link", { name: "View timetable" })).toHaveAttribute(
      "href",
      "/timetable"
    );
  });

  it("records which address missed", () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});

    renderWithProviders(<NotFound />, { route: "/nowhere" });

    expect(logged).toHaveBeenCalledWith("404: no route matches", "/nowhere");
  });

  it("gives the skip link somewhere to land", () => {
    renderWithProviders(<NotFound />, { route: "/nowhere" });

    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
  });
});
