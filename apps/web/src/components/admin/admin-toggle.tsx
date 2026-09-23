"use client";

import { useEffect, useRef } from "react";
import { ensureAdminPlugins, getJQuery } from "@/lib/admin-plugins";

type Props = {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void | Promise<void>;
};

/** Bootstrap5-toggle — same plugin as Laravel admin. */
export function AdminToggle({ checked, disabled, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let $el: ReturnType<NonNullable<typeof window.jQuery>> | null = null;

    async function init() {
      await ensureAdminPlugins();
      if (cancelled || !inputRef.current) return;

      const $ = getJQuery();
      if (!$) return;

      $el = $(inputRef.current);

      try {
        $el.bootstrapToggle("destroy");
      } catch {
        /* first init */
      }

      $el.bootstrapToggle({
        on: "Ativo",
        off: "Inativo",
        onstyle: "success",
        offstyle: "secondary",
        size: "small",
      });

      $el.bootstrapToggle(checked ? "on" : "off");
      if (disabled) $el.bootstrapToggle("disable");

      $el.off("change.adminToggle").on("change.adminToggle", async function (this: HTMLInputElement) {
        if (busyRef.current) return;
        busyRef.current = true;
        const next = this.checked;
        try {
          await onChange(next);
        } catch {
          $el?.bootstrapToggle(next ? "off" : "on");
        } finally {
          busyRef.current = false;
        }
      });
    }

    init().catch(console.error);

    return () => {
      cancelled = true;
      try {
        $el?.off("change.adminToggle");
        $el?.bootstrapToggle("destroy");
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init once per mount
  }, []);

  useEffect(() => {
    const $ = getJQuery();
    if (!$ || !inputRef.current) return;
    const $el = $(inputRef.current);
    try {
      if (disabled) {
        $el.bootstrapToggle("disable");
      } else {
        $el.bootstrapToggle("enable");
      }
      const current = Boolean($el.prop("checked"));
      if (current !== checked) {
        $el.bootstrapToggle(checked ? "on" : "off");
      }
    } catch {
      /* not initialized yet */
    }
  }, [checked, disabled]);

  return (
    <input
      ref={inputRef}
      type="checkbox"
      defaultChecked={checked}
      data-toggle="toggle"
    />
  );
}
