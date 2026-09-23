"use client";

import { useEffect } from "react";

const SHEETS = [
  "/plugins/bootstrap/css/bootstrap.min.css",
  "/plugins/bootstrap-icons/bootstrap-icons.min.css",
  "/plugins/bootstrap-fileinput-5.5.4/css/fileinput.min.css",
  "/plugins/bootstrap5-toggle-5.1.2/css/bootstrap5-toggle.min.css",
  "/admin-css/fileinput-custom.css",
  "/admin-css/toggle-custom.css",
  "/admin-css/admin-backoffice.css",
];

/** Inject Laravel admin plugin CSS (Krajee + bootstrap5-toggle). */
export function AdminPluginStyles() {
  useEffect(() => {
    for (const href of SHEETS) {
      if (document.querySelector(`link[data-admin-plugin="${href}"]`)) continue;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      link.setAttribute("data-admin-plugin", href);
      document.head.appendChild(link);
    }
  }, []);

  return null;
}
