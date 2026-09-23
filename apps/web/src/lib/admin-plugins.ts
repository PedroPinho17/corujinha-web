type JQueryFileInput = {
  fileinput: (opts?: unknown) => JQueryFileInput;
  on: (event: string, handler: (...args: unknown[]) => void) => JQueryFileInput;
  off: (event?: string) => JQueryFileInput;
};

type JQueryToggle = {
  bootstrapToggle: (opts?: unknown) => JQueryToggle;
  prop: (name: string, value?: unknown) => unknown;
};

declare global {
  interface Window {
    jQuery?: ((el: Element | null) => JQueryFileInput & JQueryToggle) & {
      fn: {
        fileinput?: unknown;
        bootstrapToggle?: unknown;
      };
    };
  }
}

let loading: Promise<void> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

export function adminPluginsReady(): boolean {
  return Boolean(
    window.jQuery?.fn?.fileinput &&
      window.jQuery?.fn?.bootstrapToggle,
  );
}

/** Load jQuery + Krajee fileinput + bootstrap5-toggle (same stack as Laravel admin). */
export function ensureAdminPlugins(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (adminPluginsReady()) return Promise.resolve();

  if (!loading) {
    loading = (async () => {
      await loadScript("/plugins/jquery/jquery-3.7.1.min.js");
      await loadScript("/plugins/bootstrap5-toggle-5.1.2/js/bootstrap5-toggle.jquery.min.js");
      await loadScript("/plugins/bootstrap-fileinput-5.5.4/js/fileinput.min.js");
      await loadScript("/plugins/bootstrap-fileinput-5.5.4/themes/bs5/theme.min.js");
      await loadScript("/plugins/bootstrap-fileinput-5.5.4/js/locales/pt.js");
    })().catch((err) => {
      loading = null;
      throw err;
    });
  }

  return loading;
}

export function getJQuery() {
  return window.jQuery;
}
