import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import QRCodeStyling, {
  type DotType,
  type CornerSquareType,
  type CornerDotType,
  type ErrorCorrectionLevel,
  type TypeNumber,
} from "qr-code-styling";
import { LogoCropper, type CropState } from "./LogoCropper";

function Section({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`section ${open ? "open" : ""}`}>
      <button className="section-header" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <span className="section-icon" />
      </button>
      <div className="section-body">
        <div className="section-inner">{children}</div>
      </div>
    </div>
  );
}

const DOT_TYPES: { value: DotType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dots", label: "Dots" },
  { value: "rounded", label: "Rounded" },
  { value: "classy", label: "Classy" },
  { value: "classy-rounded", label: "Classy R" },
  { value: "extra-rounded", label: "Extra R" },
];

const EYE_TYPES: { value: CornerSquareType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
  { value: "extra-rounded", label: "Rounded" },
];

const EYE_DOT_TYPES: { value: CornerDotType; label: string }[] = [
  { value: "square", label: "Square" },
  { value: "dot", label: "Dot" },
];

const EC_LEVELS: { value: ErrorCorrectionLevel; label: string; pct: string }[] = [
  { value: "L", label: "L", pct: "7%" },
  { value: "M", label: "M", pct: "15%" },
  { value: "Q", label: "Q", pct: "25%" },
  { value: "H", label: "H", pct: "30%" },
];

type Tab = "designer" | "library";

interface SavedQR {
  id: string;
  name: string;
  timestamp: number;
  config: QRConfig;
  logoRawSrc?: string;
  logoCropped?: string;
  logoCropState?: CropState;
  logoName: string;
  thumbnail: string;
}

const STORAGE_KEY = "qr-designer-library";

function nextDefaultName(library: SavedQR[]): string {
  const nums = library
    .map((item) => {
      const match = item.name.match(/^QR-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `QR-${String(next).padStart(3, "0")}`;
}

function loadLibrary(): SavedQR[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLibrary(items: SavedQR[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function generateThumbnail(config: QRConfig, logoCropped?: string): Promise<string> {
  return new Promise((resolve) => {
    const qr = new QRCodeStyling({
      width: 160,
      height: 160,
      data: config.data || "https://example.com",
      type: "canvas",
      dotsOptions: { type: config.dotType, color: config.dotColor },
      cornersSquareOptions: { type: config.eyeType, color: config.eyeColor },
      cornersDotOptions: { type: config.eyeDotType, color: config.eyeColor },
      backgroundOptions: { color: config.bgEnabled ? config.bgColor : "#ffffff" },
      qrOptions: { errorCorrectionLevel: config.ecLevel, typeNumber: config.qrVersion },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: config.logoMargin,
        imageSize: config.logoSize,
      },
      image: logoCropped,
    });
    const container = document.createElement("div");
    qr.append(container);
    setTimeout(() => {
      const canvas = container.querySelector("canvas");
      resolve(canvas ? canvas.toDataURL("image/png", 0.7) : "");
    }, 200);
  });
}

interface QRConfig {
  data: string;
  dotType: DotType;
  dotColor: string;
  eyeType: CornerSquareType;
  eyeDotType: CornerDotType;
  eyeColor: string;
  bgEnabled: boolean;
  bgColor: string;
  ecLevel: ErrorCorrectionLevel;
  qrVersion: TypeNumber;
  logoMargin: number;
  logoSize: number;
  logoBorderRadius: number;
}

const DEFAULT_CONFIG: QRConfig = {
  data: "https://example.com",
  dotType: "rounded",
  dotColor: "#000000",
  eyeType: "extra-rounded",
  eyeDotType: "dot",
  eyeColor: "#000000",
  bgEnabled: false,
  bgColor: "#ffffff",
  ecLevel: "H",
  qrVersion: 0,
  logoMargin: 8,
  logoSize: 0.35,
  logoBorderRadius: 8,
};

export function App() {
  const [tab, setTab] = useState<Tab>("designer");
  const [tabFade, setTabFade] = useState(true);
  const [config, setConfig] = useState<QRConfig>(DEFAULT_CONFIG);
  const [logoRawSrc, setLogoRawSrc] = useState<string | undefined>();
  const [logoCropped, setLogoCropped] = useState<string | undefined>();
  const [logoName, setLogoName] = useState<string>("");
  const [logoCropState, setLogoCropState] = useState<CropState | undefined>();
  const [library, setLibrary] = useState<SavedQR[]>(loadLibrary);
  const [qrName, setQrName] = useState(() => nextDefaultName(loadLibrary()));
  const [editingName, setEditingName] = useState(false);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [detectedVersion, setDetectedVersion] = useState<number>(0);
  const [qrFade, setQrFade] = useState(true);
  const [exportScale, setExportScale] = useState<1 | 2 | 4>(1);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const switchTab = useCallback((newTab: Tab) => {
    setTabFade(false);
    setTimeout(() => {
      setTab(newTab);
      setTabFade(true);
    }, 150);
  }, []);
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const set = useCallback(
    <K extends keyof QRConfig>(key: K, value: QRConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  useEffect(() => {
    qrCode.current = new QRCodeStyling({
      width: 320,
      height: 320,
      data: config.data,
      type: "canvas",
      dotsOptions: { type: config.dotType, color: config.dotColor },
      cornersSquareOptions: { type: config.eyeType, color: config.eyeColor },
      cornersDotOptions: { type: config.eyeDotType, color: config.eyeColor },
      backgroundOptions: { color: "transparent" },
      qrOptions: { errorCorrectionLevel: config.ecLevel, typeNumber: config.qrVersion },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: config.logoMargin,
        imageSize: config.logoSize,
      },
      image: logoCropped,
    });
    if (qrRef.current) {
      qrRef.current.innerHTML = "";
      qrCode.current.append(qrRef.current);
    }
    setTimeout(() => {
      const mc = (qrCode.current as any)?._qr?.getModuleCount?.();
      if (mc) setDetectedVersion((mc - 17) / 4);
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preview always renders transparent bg — the container CSS handles the visual background.
  // Only depend on values that affect QR rendering (not bgEnabled/bgColor).
  const { data, dotType, dotColor, eyeType, eyeDotType, eyeColor, ecLevel, qrVersion, logoMargin, logoSize } = config;
  const updateTimer = useRef<ReturnType<typeof setTimeout>>(null);
  // Track previous discrete style values to detect style-type changes
  const prevStyles = useRef({ dotType, eyeType, eyeDotType, ecLevel, qrVersion });
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (updateTimer.current) clearTimeout(updateTimer.current);
    const updateOpts = {
      data: data || "https://example.com",
      dotsOptions: { type: dotType, color: dotColor },
      cornersSquareOptions: { type: eyeType, color: eyeColor },
      cornersDotOptions: { type: eyeDotType, color: eyeColor },
      backgroundOptions: { color: "transparent" },
      qrOptions: { errorCorrectionLevel: ecLevel, typeNumber: qrVersion },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: logoMargin,
        imageSize: logoSize,
      },
      image: logoCropped,
    };
    const prev = prevStyles.current;
    const styleChanged = prev.dotType !== dotType || prev.eyeType !== eyeType
      || prev.eyeDotType !== eyeDotType || prev.ecLevel !== ecLevel || prev.qrVersion !== qrVersion;
    prevStyles.current = { dotType, eyeType, eyeDotType, ecLevel, qrVersion };

    const detectVersion = () => {
      setTimeout(() => {
        const mc = (qrCode.current as any)?._qr?.getModuleCount?.();
        if (mc) setDetectedVersion((mc - 17) / 4);
      }, 100);
    };

    if (isFirstRender.current) {
      isFirstRender.current = false;
      updateTimer.current = setTimeout(() => { qrCode.current?.update(updateOpts); detectVersion(); }, 80);
    } else if (styleChanged) {
      // Discrete style change — crossfade
      setQrFade(false);
      updateTimer.current = setTimeout(() => {
        qrCode.current?.update(updateOpts);
        detectVersion();
        setTimeout(() => setQrFade(true), 30);
      }, 150);
    } else {
      // Continuous change (sliders, data, colors) — debounced instant update
      updateTimer.current = setTimeout(() => { qrCode.current?.update(updateOpts); detectVersion(); }, 80);
    }
    return () => {
      if (updateTimer.current) clearTimeout(updateTimer.current);
    };
  }, [data, dotType, dotColor, eyeType, eyeDotType, eyeColor, ecLevel, qrVersion, logoMargin, logoSize, logoCropped]);

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoCropState(undefined);
      setLogoRawSrc(e.target?.result as string);
      setLogoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoRawSrc(undefined);
    setLogoCropped(undefined);
    setLogoCropState(undefined);
    setLogoName("");
  };

  const handleCropped = useCallback((dataUrl: string) => {
    setLogoCropped(dataUrl);
  }, []);

  const handleCropStateChange = useCallback((state: CropState) => {
    setLogoCropState(state);
  }, []);

  const [saveFlash, setSaveFlash] = useState(false);
  const flashSave = () => {
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1200);
  };

  const saveToLibrary = async () => {
    const thumbnail = await generateThumbnail(config, logoCropped);

    if (activeItemId) {
      // Update existing item in place
      const updated = library.map((item) =>
        item.id === activeItemId
          ? { ...item, name: qrName || "Untitled", timestamp: Date.now(), config, logoRawSrc, logoCropped, logoCropState, logoName, thumbnail }
          : item
      );
      setLibrary(updated);
      saveLibrary(updated);
    } else {
      // Create new entry
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const entry: SavedQR = {
        id,
        name: qrName || "Untitled",
        timestamp: Date.now(),
        config,
        logoRawSrc,
        logoCropped,
        logoCropState,
        logoName,
        thumbnail,
      };
      const updated = [entry, ...library];
      setLibrary(updated);
      saveLibrary(updated);
      setActiveItemId(id);
    }
    flashSave();
  };

  const fadeQrAndDo = useCallback((fn: () => void) => {
    setQrFade(false);
    setTimeout(() => {
      fn();
      setTimeout(() => setQrFade(true), 60);
    }, 180);
  }, []);

  const startNew = () => {
    fadeQrAndDo(() => {
      setConfig(DEFAULT_CONFIG);
      setLogoRawSrc(undefined);
      setLogoCropped(undefined);
      setLogoCropState(undefined);
      setLogoName("");
      setActiveItemId(null);
      setQrName(nextDefaultName(library));
    });
  };

  const loadFromLibrary = (item: SavedQR) => {
    fadeQrAndDo(() => {
      setConfig({ ...DEFAULT_CONFIG, ...item.config });
      setLogoCropState(item.logoCropState);
      setLogoRawSrc(item.logoRawSrc);
      setLogoCropped(item.logoCropped);
      setLogoName(item.logoName);
      setQrName(item.name);
      setActiveItemId(item.id);
    });
    switchTab("designer");
  };

  const deleteFromLibrary = (id: string) => {
    const updated = library.filter((item) => item.id !== id);
    setLibrary(updated);
    saveLibrary(updated);
    if (activeItemId === id) {
      setActiveItemId(null);
      setQrName(nextDefaultName(updated));
    }
  };

  const duplicateFromLibrary = (item: SavedQR) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const name = `${item.name} copy`;
    const entry: SavedQR = { ...item, id, name, timestamp: Date.now() };
    const updated = [entry, ...library];
    setLibrary(updated);
    saveLibrary(updated);
    loadFromLibrary(entry);
  };

  const exportLibrary = () => {
    const data = JSON.stringify(library, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-library-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importLibrary = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string) as SavedQR[];
        if (!Array.isArray(imported)) throw new Error("Invalid format");
        // Merge: imported items replace existing ones with the same id, new ones prepended
        const existingMap = new Map(library.map((item) => [item.id, item]));
        for (const item of imported) existingMap.set(item.id, item);
        const merged = [...existingMap.values()].sort((a, b) => b.timestamp - a.timestamp);
        setLibrary(merged);
        saveLibrary(merged);
      } catch {
        alert("Invalid library file — could not import.");
      }
    };
    reader.readAsText(file);
  };

  const PREVIEW_SIZE = 320;
  const EXPORT_SIZE = 1024 * exportScale;

  // Scanability warning: logoSize is the ratio of logo width to QR width,
  // so area coverage ≈ logoSize². EC tolerances per spec: L=7%, M=15%, Q=25%, H=30%.
  const EC_TOLERANCES: Record<ErrorCorrectionLevel, number> = { L: 0.07, M: 0.15, Q: 0.25, H: 0.30 };
  const logoCoverageWarning = logoCropped
    ? (() => {
        const coverage = config.logoSize * config.logoSize;
        const tolerance = EC_TOLERANCES[config.ecLevel];
        const coveragePct = Math.round(coverage * 100);
        const tolerancePct = Math.round(tolerance * 100);
        if (coverage > tolerance) {
          return { level: "error" as const, msg: `⚠️ Logo covers ~${coveragePct}% of QR area — exceeds ${config.ecLevel} error correction (${tolerancePct}%). Scan may fail.` };
        } else if (coverage > tolerance * 0.85) {
          return { level: "warn" as const, msg: `⚠️ Logo covers ~${coveragePct}% — close to ${config.ecLevel} correction limit (${tolerancePct}%).` };
        }
        return null;
      })()
    : null;

  const download = async (extension: "png" | "svg") => {
    const scale = EXPORT_SIZE / PREVIEW_SIZE;
    const exportQR = new QRCodeStyling({
      width: EXPORT_SIZE,
      height: EXPORT_SIZE,
      data: config.data || "https://example.com",
      type: extension === "svg" ? "svg" : "canvas",
      dotsOptions: { type: config.dotType, color: config.dotColor },
      cornersSquareOptions: { type: config.eyeType, color: config.eyeColor },
      cornersDotOptions: { type: config.eyeDotType, color: config.eyeColor },
      backgroundOptions: { color: config.bgEnabled ? config.bgColor : "transparent" },
      qrOptions: { errorCorrectionLevel: config.ecLevel, typeNumber: config.qrVersion },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: Math.round(config.logoMargin * scale),
        imageSize: config.logoSize,
      },
      image: logoCropped,
    });

    if (extension === "svg") {
      // Render to temp container, post-process SVG, then download
      const container = document.createElement("div");
      exportQR.append(container);
      await new Promise((r) => setTimeout(r, 150));

      const svg = container.querySelector("svg");
      if (!svg) return;

      // Fix background: if bg is off, ensure no white fill leaks through
      if (!config.bgEnabled) {
        const rects = svg.querySelectorAll("rect");
        for (const rect of rects) {
          const fill = rect.getAttribute("fill");
          if (
            fill &&
            (fill === "#ffffff" || fill === "#fff" || fill === "white" || fill === "transparent") &&
            parseFloat(rect.getAttribute("width") || "0") >= EXPORT_SIZE * 0.9
          ) {
            rect.setAttribute("fill", "none");
          }
        }
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(qrName || "qr-code").toLowerCase()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      exportQR.download({ name: (qrName || "qr-code").toLowerCase(), extension });
    }
  };

  return (
    <div className="app">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="tab-bar">
            <button
              className={tab === "designer" ? "active" : ""}
              onClick={() => switchTab("designer")}
            >
              QR Designer
            </button>
            <button
              className={tab === "library" ? "active" : ""}
              onClick={() => switchTab("library")}
            >
              Library ({library.length})
            </button>
          </div>
        </div>

        <div className={`sidebar-scroll ${tabFade ? "visible" : ""}`}>
          {tab === "library" ? (
            <div className="library">
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importLibrary(file);
                  e.target.value = "";
                }}
              />
              <div className="library-io-row">
                <button className="library-io-btn" onClick={exportLibrary} title="Export library as JSON">
                  Export JSON
                </button>
                <button className="library-io-btn" onClick={() => importInputRef.current?.click()} title="Import library from JSON">
                  Import JSON
                </button>
              </div>
              {library.length === 0 ? (
                <div className="library-empty">
                  No saved QR codes yet
                </div>
              ) : (
                <div className="library-grid">
                  {library.map((item) => (
                    <div key={item.id} className={`library-item ${item.id === activeItemId ? "active" : ""}`} onClick={() => loadFromLibrary(item)}>
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                      />
                      <div className="library-item-info">
                        <span className="library-item-name">{item.name}</span>
                        <span className="library-item-date">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="library-item-actions">
                        <button
                          className="library-item-action"
                          onClick={(e) => { e.stopPropagation(); duplicateFromLibrary(item); }}
                          title="Duplicate"
                        >
                          dup
                        </button>
                        <button
                          className="library-item-action library-item-delete"
                          onClick={(e) => { e.stopPropagation(); deleteFromLibrary(item.id); }}
                          title="Delete"
                        >
                          x
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="designer-controls">
              <div className="name-row">
                <input
                  ref={nameInputRef}
                  className={`name-field ${editingName ? "editing" : ""}`}
                  type="text"
                  value={qrName}
                  readOnly={!editingName}
                  onChange={(e) => setQrName(e.target.value)}
                  onFocus={() => setEditingName(true)}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setEditingName(false);
                      nameInputRef.current?.blur();
                    }
                  }}
                />
                <button className={`save-btn-inline ${saveFlash ? "saved" : ""}`} onClick={saveToLibrary}>
                  Save
                </button>
                <button className={`new-btn-inline ${activeItemId ? "visible" : ""}`} onClick={startNew}>
                  New
                </button>
              </div>

              <div className="control-group">
                <label>Content</label>
                <textarea
                  value={config.data}
                  onChange={(e) => set("data", e.target.value)}
                  placeholder="URL, text, or any data..."
                  rows={2}
                />
              </div>

              <Section title="Style" defaultOpen>
                <div className="control-group">
                  <label>Dot Style</label>
                  <div className="option-grid">
                    {DOT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        className={config.dotType === t.value ? "active" : ""}
                        onClick={() => set("dotType", t.value)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-group">
                  <label>Eye Frame</label>
                  <div className="option-grid">
                    {EYE_TYPES.map((t) => (
                      <button
                        key={t.value}
                        className={config.eyeType === t.value ? "active" : ""}
                        onClick={() => set("eyeType", t.value)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="control-group">
                  <label>Eye Dot</label>
                  <div className="option-grid">
                    {EYE_DOT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        className={config.eyeDotType === t.value ? "active" : ""}
                        onClick={() => set("eyeDotType", t.value)}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Section>

              <Section title="Colors" defaultOpen>
                <div className="control-group">
                  <div className="color-row">
                    <div className="color-input">
                      <input
                        type="color"
                        value={config.dotColor}
                        onChange={(e) => set("dotColor", e.target.value)}
                      />
                      <span>Dots</span>
                    </div>
                    <div className="color-input">
                      <input
                        type="color"
                        value={config.eyeColor}
                        onChange={(e) => set("eyeColor", e.target.value)}
                      />
                      <span>Eyes</span>
                    </div>
                  </div>
                </div>

                <div className="control-group">
                  <label>Background</label>
                  <div className="bg-toggle-row">
                    <button
                      className={!config.bgEnabled ? "active" : ""}
                      onClick={() => set("bgEnabled", false)}
                    >
                      OFF
                    </button>
                    <button
                      className={config.bgEnabled ? "active" : ""}
                      onClick={() => set("bgEnabled", true)}
                    >
                      ON
                    </button>
                    <div className={`color-input bg-color-fade ${config.bgEnabled ? "visible" : ""}`}>
                      <input
                        type="color"
                        value={config.bgColor}
                        onChange={(e) => set("bgColor", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </Section>

              <Section title="Error Correction">
                <div className="ec-grid">
                  {EC_LEVELS.map((l) => (
                    <button
                      key={l.value}
                      className={config.ecLevel === l.value ? "active" : ""}
                      onClick={() => set("ecLevel", l.value)}
                    >
                      {l.label}
                      <span>{l.pct}</span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="QR Version">
                <div className="version-control">
                  <div className="version-toggle">
                    <button
                      className={config.qrVersion === 0 ? "active" : ""}
                      onClick={() => set("qrVersion", 0 as TypeNumber)}
                    >
                      Auto
                      {config.qrVersion === 0 && <span>v{detectedVersion}</span>}
                    </button>
                    <button
                      className={config.qrVersion !== 0 ? "active" : ""}
                      onClick={() => set("qrVersion", (detectedVersion || 4) as TypeNumber)}
                    >
                      Locked
                      {config.qrVersion !== 0 && <span>v{config.qrVersion}</span>}
                    </button>
                  </div>
                  {config.qrVersion !== 0 && (
                    <div className="version-slider">
                      <input
                        type="range"
                        min={1}
                        max={40}
                        value={config.qrVersion}
                        onChange={(e) => set("qrVersion", Number(e.target.value) as TypeNumber)}
                      />
                      <span className="version-label">{(config.qrVersion - 1) * 4 + 21} x {(config.qrVersion - 1) * 4 + 21} modules</span>
                    </div>
                  )}
                </div>
              </Section>

              <Section title="Logo" defaultOpen>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                  }}
                />
                {logoRawSrc ? (
                  <>
                    <div className="logo-header">
                      <span>{logoName}</span>
                      <button className="logo-remove" onClick={removeLogo}>
                        Remove
                      </button>
                    </div>
                    <LogoCropper
                      imageSrc={logoRawSrc}
                      size={200}
                      borderRadius={config.logoBorderRadius}
                      initialCropState={logoCropState}
                      onCropped={handleCropped}
                      onCropStateChange={handleCropStateChange}
                    />
                    <div className="control-group">
                      <label>Corner Radius</label>
                      <div className="slider-row">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={config.logoBorderRadius}
                          onChange={(e) =>
                            set("logoBorderRadius", Number(e.target.value))
                          }
                        />
                        <span>{config.logoBorderRadius}px</span>
                      </div>
                    </div>
                    <div className="control-group">
                      <label>Logo Size</label>
                      <div className="slider-row">
                        <input
                          type="range"
                          min="0.1"
                          max="0.5"
                          step="0.01"
                          value={config.logoSize}
                          onChange={(e) => set("logoSize", Number(e.target.value))}
                        />
                        <span>{Math.round(config.logoSize * 100)}%</span>
                      </div>
                    </div>
                    <div className="control-group">
                      <label>Logo Margin</label>
                      <div className="slider-row">
                        <input
                          type="range"
                          min="0"
                          max="20"
                          step="1"
                          value={config.logoMargin}
                          onChange={(e) => set("logoMargin", Number(e.target.value))}
                        />
                        <span>{config.logoMargin}px</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div
                    className="logo-dropzone"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleLogoUpload(file);
                    }}
                  >
                    Drop image or click to upload
                  </div>
                )}
              </Section>

              <div className="credit">
                Designed + Engineered by <a href="https://catcatcat.ai" target="_blank" rel="noopener noreferrer"><strong>&gt;catcatcat.ai<span className="cursor">▮</span></strong></a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="preview">
        <div className="preview-center">
          <div
            className={`qr-container ${!config.bgEnabled ? "transparent-bg" : ""}`}
            style={{ "--qr-bg": config.bgEnabled ? config.bgColor : "#fff" } as React.CSSProperties}
          >
            <div ref={qrRef} className={`qr-canvas ${qrFade ? "" : "fading"}`} />
          </div>
          {logoCoverageWarning && (
            <div className={`scanability-warning ${logoCoverageWarning.level}`}>
              {logoCoverageWarning.msg}
            </div>
          )}
          <div className="download-row">
            <div className="resolution-picker">
              {([1, 2, 4] as const).map((s) => (
                <button
                  key={s}
                  className={exportScale === s ? "active" : ""}
                  onClick={() => setExportScale(s)}
                  title={`Export at ${1024 * s}px`}
                >
                  {s}×
                </button>
              ))}
            </div>
            <button onClick={() => download("png")}>Download PNG</button>
            <button onClick={() => download("svg")}>Download SVG</button>
          </div>
        </div>
      </div>
    </div>
  );
}
