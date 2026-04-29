import { describe, expect, it } from "vitest";
import { PersonStatus } from "../../generated/prisma/client";
import { personStatusDisplay } from "./status-display";

describe("person status display", () => {
  it("shows in-care people with the care tone", () => {
    expect(personStatusDisplay(PersonStatus.COOLING_AWAY)).toEqual({ label: "Em cuidado", tone: "care" });
  });

  it("keeps active people green", () => {
    expect(personStatusDisplay(PersonStatus.ACTIVE)).toEqual({ label: "Ativo", tone: "ok" });
  });
});
