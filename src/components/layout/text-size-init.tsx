"use client";

import { useEffect } from "react";
import { applyTextSize, getStoredTextSize } from "@/features/text-size/text-size";

export function TextSizeInit() {
  useEffect(() => {
    applyTextSize(getStoredTextSize());
  }, []);

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `(function(){try{var s=localStorage.getItem('koinonia-text-size');if(s==='large'||s==='extra-large')document.documentElement.setAttribute('data-text-size',s);}catch(e){}})();`,
      }}
    />
  );
}
