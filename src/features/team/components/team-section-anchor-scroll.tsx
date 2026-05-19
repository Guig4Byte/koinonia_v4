"use client";

import { useEffect } from "react";
import { SUPERVISORS_SECTION_ID } from "@/features/team/team-routes";

export function TeamSectionAnchorScroll() {
  useEffect(() => {
    if (window.location.hash !== `#${SUPERVISORS_SECTION_ID}`) return;

    const frameId = window.requestAnimationFrame(() => {
      document.getElementById(SUPERVISORS_SECTION_ID)?.scrollIntoView({ block: "start" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, []);

  return null;
}
