"use client";

import { MapPinned, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { GeoPoint } from "@/types/domain";

type LeafletLayerLike = {
  addTo(map: LeafletMapLike): LeafletLayerLike;
  bindTooltip(label: string, options?: Record<string, unknown>): LeafletLayerLike;
};

type LeafletMapLike = {
  fitBounds(bounds: unknown, options?: Record<string, unknown>): void;
  remove(): void;
};

type LeafletLike = {
  map(
    element: HTMLElement,
    options?: Record<string, unknown>,
  ): LeafletMapLike;
  tileLayer(
    urlTemplate: string,
    options?: Record<string, unknown>,
  ): { addTo(map: LeafletMapLike): void };
  circleMarker(
    latLng: [number, number],
    options?: Record<string, unknown>,
  ): LeafletLayerLike;
  polyline(
    latLngs: Array<[number, number]>,
    options?: Record<string, unknown>,
  ): LeafletLayerLike;
  latLngBounds(latLngs: Array<[number, number]>): unknown;
};

declare global {
  interface Window {
    L?: LeafletLike;
  }
}

let leafletAssetsPromise: Promise<LeafletLike> | null = null;

function loadLeafletAssets() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Leaflet solo puede cargarse en el navegador."));
  }

  if (window.L) {
    return Promise.resolve(window.L);
  }

  if (!leafletAssetsPromise) {
    leafletAssetsPromise = new Promise<LeafletLike>((resolve, reject) => {
      const existingStyle = document.getElementById("leaflet-cdn-style");
      if (!existingStyle) {
        const style = document.createElement("link");
        style.id = "leaflet-cdn-style";
        style.rel = "stylesheet";
        style.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(style);
      }

      const existingScript = document.getElementById("leaflet-cdn-script");
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          if (window.L) {
            resolve(window.L);
            return;
          }

          reject(new Error("Leaflet no pudo inicializarse."));
        });
        existingScript.addEventListener("error", () => {
          reject(new Error("No se pudieron cargar los recursos del mapa."));
        });
        return;
      }

      const script = document.createElement("script");
      script.id = "leaflet-cdn-script";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.async = true;
      script.onload = () => {
        if (window.L) {
          resolve(window.L);
          return;
        }

        reject(new Error("Leaflet no pudo inicializarse."));
      };
      script.onerror = () => {
        reject(new Error("No se pudieron cargar los recursos del mapa."));
      };
      document.body.appendChild(script);
    });
  }

  return leafletAssetsPromise;
}

type ReportMapModalProps = {
  checkInLocation: GeoPoint;
  checkOutLocation: GeoPoint;
};

export function ReportMapModal({
  checkInLocation,
  checkOutLocation,
}: ReportMapModalProps) {
  const dialogTitleId = useId();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMapLike | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !mapRef.current) {
      return;
    }

    let cancelled = false;
    setIsLoadingMap(true);
    setMapError(null);

    loadLeafletAssets()
      .then((leaflet) => {
        if (cancelled || !mapRef.current) {
          return;
        }

        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        const map = leaflet.map(mapRef.current, {
          zoomControl: true,
          attributionControl: true,
        });

        leaflet
          .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap contributors",
          })
          .addTo(map);

        const points: Array<[number, number]> = [
          [checkInLocation.lat, checkInLocation.lng],
          [checkOutLocation.lat, checkOutLocation.lng],
        ];

        leaflet
          .circleMarker(points[0], {
            radius: 9,
            color: "#0f766e",
            weight: 3,
            fillColor: "#5eead4",
            fillOpacity: 0.95,
          })
          .addTo(map)
          .bindTooltip("Ingreso", { permanent: true, direction: "top" });

        leaflet
          .circleMarker(points[1], {
            radius: 9,
            color: "#b45309",
            weight: 3,
            fillColor: "#fcd34d",
            fillOpacity: 0.95,
          })
          .addTo(map)
          .bindTooltip("Egreso", { permanent: true, direction: "top" });

        leaflet.polyline(points, {
          color: "#334155",
          weight: 2,
          opacity: 0.45,
          dashArray: "6 8",
        }).addTo(map);

        map.fitBounds(leaflet.latLngBounds(points), {
          padding: [36, 36],
        });

        mapInstanceRef.current = map;
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setMapError(
          error instanceof Error
            ? error.message
            : "No se pudo cargar el mapa.",
        );
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingMap(false);
        }
      });

    return () => {
      cancelled = true;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [checkInLocation.lat, checkInLocation.lng, checkOutLocation.lat, checkOutLocation.lng, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)} type="button">
        Ver mapa
        <MapPinned className="size-4" />
      </Button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-surface-ink/45 px-4"
          onClick={() => setIsOpen(false)}
        >
          <div
            aria-labelledby={dialogTitleId}
            aria-modal="true"
            className="w-full max-w-4xl rounded-[2rem] border border-surface-line bg-surface p-5 shadow-2xl sm:p-6"
            role="dialog"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-surface-accent">
                  Ubicaciones de la jornada
                </p>
                <h2
                  className="mt-3 text-2xl font-semibold text-surface-ink"
                  id={dialogTitleId}
                >
                  Ingreso y egreso marcados en el mapa
                </h2>
                <p className="mt-2 text-sm text-surface-ink/72">
                  Verde para el ingreso. Amarillo para el egreso.
                </p>
              </div>
              <button
                aria-label="Cerrar mapa"
                className="inline-flex size-11 items-center justify-center rounded-full border border-surface-line bg-surface-muted text-surface-ink transition hover:bg-surface-line/60"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-surface-muted px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Ingreso
                </p>
                <p className="mt-2 text-sm font-medium text-surface-ink">
                  {checkInLocation.lat.toFixed(6)}, {checkInLocation.lng.toFixed(6)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-surface-muted px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Egreso
                </p>
                <p className="mt-2 text-sm font-medium text-surface-ink">
                  {checkOutLocation.lat.toFixed(6)}, {checkOutLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="relative mt-6 overflow-hidden rounded-[1.75rem] border border-surface-line bg-surface-muted">
              {mapError ? (
                <div className="px-5 py-16 text-center text-sm text-surface-danger">
                  {mapError}
                </div>
              ) : (
                <>
                  <div
                    ref={mapRef}
                    style={{ height: "min(65vh, 28rem)", width: "100%" }}
                  />
                  {isLoadingMap ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-surface-muted/90 px-5 text-center text-sm text-surface-ink/72">
                      Cargando mapa...
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
