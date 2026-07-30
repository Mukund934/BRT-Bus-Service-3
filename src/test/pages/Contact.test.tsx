import { describe, expect, it, vi } from "vitest";
import Contact from "@/pages/Contact";
import { renderWithProviders, screen } from "../helpers/render";

vi.mock("@/services/userService", async () => {
  const helper = await import("../helpers/userService");
  return helper.userServiceMock();
});

describe("reaching the team", () => {
  it("introduces every member with their role", () => {
    renderWithProviders(<Contact />, { route: "/contact" });

    expect(
      screen.getByRole("heading", { name: "Mukund Thakur" })
    ).toBeInTheDocument();
    expect(screen.getByText("Team Leader & Web Developer")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Dharmendra Dhruw" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ayush Deep" })
    ).toBeInTheDocument();
  });

  it("lists every address a member publishes", () => {
    renderWithProviders(<Contact />, { route: "/contact" });

    expect(screen.getByText("📧 mukund.th04@gmail.com")).toBeInTheDocument();
    expect(
      screen.getByText("📧 mukund23101@iiitnr.edu.in")
    ).toBeInTheDocument();
  });

  it("shows a phone number for each member", () => {
    renderWithProviders(<Contact />, { route: "/contact" });

    expect(screen.getByText("📞 93404 49412")).toBeInTheDocument();
    expect(screen.getByText("📞 62686 93848")).toBeInTheDocument();
    expect(screen.getByText("📞 97700 98789")).toBeInTheDocument();
  });
});
