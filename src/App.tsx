import { useState, useRef, useEffect, useCallback } from "react";
import QRCodeStyling, {
  type DotType,
  type CornerSquareType,
  type CornerDotType,
  type ErrorCorrectionLevel,
} from "qr-code-styling";
import { LogoCropper } from "./LogoCropper";

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
  logoName: string;
  thumbnail: string;
}

const STORAGE_KEY = "qr-designer-library";

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
      qrOptions: { errorCorrectionLevel: config.ecLevel },
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
  logoMargin: 8,
  logoSize: 0.35,
  logoBorderRadius: 20,
};

export function App() {
  const [tab, setTab] = useState<Tab>("designer");
  const [tabFade, setTabFade] = useState(true);
  const [config, setConfig] = useState<QRConfig>(DEFAULT_CONFIG);
  const [logoRawSrc, setLogoRawSrc] = useState<string | undefined>();
  const [logoCropped, setLogoCropped] = useState<string | undefined>();
  const [logoName, setLogoName] = useState<string>("");
  const [library, setLibrary] = useState<SavedQR[]>(loadLibrary);

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

  // Initialize QR code
  useEffect(() => {
    qrCode.current = new QRCodeStyling({
      width: 320,
      height: 320,
      data: config.data,
      type: "canvas",
      dotsOptions: { type: config.dotType, color: config.dotColor },
      cornersSquareOptions: { type: config.eyeType, color: config.eyeColor },
      cornersDotOptions: { type: config.eyeDotType, color: config.eyeColor },
      backgroundOptions: { color: config.bgEnabled ? config.bgColor : "transparent" },
      qrOptions: { errorCorrectionLevel: config.ecLevel },
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
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update QR code on config/logo changes
  useEffect(() => {
    qrCode.current?.update({
      data: config.data || "https://example.com",
      dotsOptions: { type: config.dotType, color: config.dotColor },
      cornersSquareOptions: { type: config.eyeType, color: config.eyeColor },
      cornersDotOptions: { type: config.eyeDotType, color: config.eyeColor },
      backgroundOptions: { color: config.bgEnabled ? config.bgColor : "transparent" },
      qrOptions: { errorCorrectionLevel: config.ecLevel },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: config.logoMargin,
        imageSize: config.logoSize,
      },
      image: logoCropped,
    });
  }, [config, logoCropped]);

  const handleLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoRawSrc(e.target?.result as string);
      setLogoName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoRawSrc(undefined);
    setLogoCropped(undefined);
    setLogoName("");
  };

  const handleCropped = useCallback((dataUrl: string) => {
    setLogoCropped(dataUrl);
  }, []);

  const saveToLibrary = async () => {
    const thumbnail = await generateThumbnail(config, logoCropped);
    const entry: SavedQR = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: config.data.slice(0, 40) || "Untitled",
      timestamp: Date.now(),
      config,
      logoRawSrc,
      logoCropped,
      logoName,
      thumbnail,
    };
    const updated = [entry, ...library];
    setLibrary(updated);
    saveLibrary(updated);
  };

  const loadFromLibrary = (item: SavedQR) => {
    setConfig(item.config);
    setLogoRawSrc(item.logoRawSrc);
    setLogoCropped(item.logoCropped);
    setLogoName(item.logoName);
    setTab("designer");
  };

  const deleteFromLibrary = (id: string) => {
    const updated = library.filter((item) => item.id !== id);
    setLibrary(updated);
    saveLibrary(updated);
  };

  const download = (extension: "png" | "svg") => {
    // For high-res download, create a temporary large QR
    const exportQR = new QRCodeStyling({
      width: 1024,
      height: 1024,
      data: config.data || "https://example.com",
      type: extension === "svg" ? "svg" : "canvas",
      dotsOptions: { type: config.dotType, color: config.dotColor },
      cornersSquareOptions: { type: config.eyeType, color: config.eyeColor },
      cornersDotOptions: { type: config.eyeDotType, color: config.eyeColor },
      backgroundOptions: { color: config.bgEnabled ? config.bgColor : "transparent" },
      qrOptions: { errorCorrectionLevel: config.ecLevel },
      imageOptions: {
        crossOrigin: "anonymous",
        margin: config.logoMargin,
        imageSize: config.logoSize,
      },
      image: logoCropped,
    });
    exportQR.download({ name: "qr-code", extension });
  };

  return (
    <div className="app">
      <div className="controls">
        <div className="tab-bar">
          <button
            className={tab === "designer" ? "active" : ""}
            onClick={() => switchTab("designer")}
          >
            Designer
          </button>
          <button
            className={tab === "library" ? "active" : ""}
            onClick={() => switchTab("library")}
          >
            Library ({library.length})
          </button>
        </div>

        <div className={`tab-content ${tabFade ? "visible" : ""}`}>
        {tab === "library" ? (
          <div className="library">
            {library.length === 0 ? (
              <div className="library-empty">
                No saved QR codes yet
              </div>
            ) : (
              <div className="library-grid">
                {library.map((item) => (
                  <div key={item.id} className="library-item">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      onClick={() => loadFromLibrary(item)}
                    />
                    <div className="library-item-info">
                      <span className="library-item-name">{item.name}</span>
                      <span className="library-item-date">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      className="library-item-delete"
                      onClick={() => deleteFromLibrary(item.id)}
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <>
        <div className="control-group">
          <label>Content</label>
          <textarea
            value={config.data}
            onChange={(e) => set("data", e.target.value)}
            placeholder="URL, text, or any data..."
            rows={2}
          />
        </div>

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

        <div className="control-group">
          <label>Colors</label>
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
            {config.bgEnabled && (
              <div className="color-input">
                <input
                  type="color"
                  value={config.bgColor}
                  onChange={(e) => set("bgColor", e.target.value)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="control-group">
          <label>Error Correction</label>
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
        </div>

        <div className="control-group">
          <label>Center Logo</label>
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
                  x
                </button>
              </div>
              <LogoCropper
                imageSrc={logoRawSrc}
                size={200}
                borderRadius={config.logoBorderRadius}
                onCropped={handleCropped}
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
        </div>

        <button className="save-btn" onClick={saveToLibrary}>
          Save to Library
        </button>
        </>
        )}
        </div>
      </div>

      <div className="preview">
        <div
          className="qr-container"
          style={{
            background: config.bgEnabled ? config.bgColor : "#fff",
          }}
        >
          <div ref={qrRef} />
        </div>
        <div className="download-row">
          <button onClick={() => download("png")}>Download PNG</button>
          <button onClick={() => download("svg")}>Download SVG</button>
        </div>
      </div>
    </div>
  );
}
