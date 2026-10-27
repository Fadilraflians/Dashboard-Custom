"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import Icon from "../PusatInformasi/Icon";
import styles from "./styles.module.css";

export type DistributionRankItem = {
  name: string;
  percent: number;
  sent: string;
  realized: string;
  value: number;
  lat: number;
  lng: number;
};

export type DistributionMapPanelProps = {
  highest: DistributionRankItem[];
  lowest: DistributionRankItem[];
  rankingLabel?: string;
};

const NATIONAL_CENTER: [number, number] = [-2.4, 118];

const formatPercent = (value: number) => `${value.toFixed(1).replace(".", ",")}%`;

export default function DistributionMapPanel({
  highest,
  lowest,
  rankingLabel = "Realisasi Provinsi",
}: DistributionMapPanelProps) {
  const [mode, setMode] = useState<"highest" | "lowest">("highest");
  const [query, setQuery] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  const activeItems = mode === "highest" ? highest : lowest;
  const visibleItems = useMemo(() => {
    const keyword = query.trim().toLocaleLowerCase("id-ID");
    if (!keyword) return activeItems;
    return activeItems.filter((item) => item.name.toLocaleLowerCase("id-ID").includes(keyword));
  }, [activeItems, query]);

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      if (!mapElementRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (cancelled || !mapElementRef.current) return;

      leafletRef.current = L;
      const map = L.map(mapElementRef.current, {
        center: NATIONAL_CENTER,
        zoom: 4,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      markerLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setMapReady(true);
      window.setTimeout(() => map.invalidateSize(), 0);
    }

    void initializeMap();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      leafletRef.current = null;
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const layer = markerLayerRef.current;
    if (!mapReady || !L || !layer) return;

    layer.clearLayers();
    const color = mode === "highest" ? "#007a78" : "#c65024";
    const fillColor = mode === "highest" ? "#10b99a" : "#f97350";

    visibleItems.forEach((item, index) => {
      const marker = L.circleMarker([item.lat, item.lng], {
        radius: index < 3 ? 9 : 7,
        color: "#ffffff",
        weight: 2,
        fillColor,
        fillOpacity: 1,
      });

      marker.bindTooltip(
        `<strong>${index + 1}. ${item.name}</strong><br/>Realisasi ${formatPercent(item.percent)}<br/>Salur ${item.sent}<br/>Realisasi ${item.realized}`,
        { direction: "top", offset: [0, -7], className: "distribution-map-tooltip" },
      );
      marker.on("click", () => mapRef.current?.flyTo([item.lat, item.lng], 8, { duration: 0.7 }));
      marker.addTo(layer);
    });
  }, [mapReady, mode, visibleItems]);

  useEffect(() => {
    if (!mapReady) return;
    mapRef.current?.flyTo(NATIONAL_CENTER, 4, { duration: 0.6 });
  }, [mapReady, mode]);

  const focusItem = (item: DistributionRankItem) => {
    mapRef.current?.flyTo([item.lat, item.lng], 8, { duration: 0.7 });
  };

  const resetView = () => {
    setQuery("");
    mapRef.current?.flyTo(NATIONAL_CENTER, 4, { duration: 0.7 });
  };

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <h2>Peta Sebaran Titik Penyaluran Dana BOK Nasional</h2>
          <p>Visualisasi wilayah penerima alokasi dana BOK serta perbandingan realisasi tertinggi dan terendah.</p>
        </div>
        <div className={styles.headerTools}>
          <span><i /> 38 Provinsi / 514 Titik Satker Terkoneksi</span>
          <button type="button" onClick={resetView}><Icon name="grid" size={15} /> Full View</button>
        </div>
      </header>

      <div className={styles.content}>
        <aside className={`${styles.ranking} ${mode === "lowest" ? styles.rankingLowest : ""}`}>
          <div className={styles.rankingHeader}>
            <div>
              <h3><Icon name="chart" size={17} /> Top 10 Realisasi</h3>
              <p>{rankingLabel}</p>
            </div>
            <span>Nasional</span>
          </div>

          <div className={styles.toggle}>
            <button className={mode === "highest" ? styles.active : ""} type="button" onClick={() => setMode("highest")}>
              <Icon name="chart" size={13} /> Tertinggi
            </button>
            <button className={mode === "lowest" ? styles.active : ""} type="button" onClick={() => setMode("lowest")}>
              <Icon name="chart" size={13} /> Terendah
            </button>
          </div>

          <div className={styles.rankingList}>
            {activeItems.map((item, index) => (
              <button className={styles.rankingItem} type="button" key={item.name} onClick={() => focusItem(item)}>
                <span className={styles.itemTitle}>
                  <i>{index + 1}</i>
                  <strong>{item.name}</strong>
                  <b>{formatPercent(item.percent)}</b>
                </span>
                <span className={styles.progress}><i style={{ width: `${item.percent}%` }} /></span>
                <span className={styles.itemMeta}><em>Salur: {item.sent}</em><em>Realisasi: {item.realized}</em></span>
              </button>
            ))}
          </div>
        </aside>

        <div className={styles.mapCard}>
          <label className={styles.search}>
            <Icon name="search" size={14} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari wilayah pada peta..." />
          </label>
          <div className={styles.map} ref={mapElementRef} aria-label="Peta sebaran realisasi dana BOK" />
          {!mapReady && <div className={styles.loading}>Memuat peta...</div>}
          <button className={styles.resetButton} type="button" onClick={resetView} title="Tampilkan seluruh Indonesia">
            <Icon name="home" size={15} />
          </button>
          <div className={styles.mapKey}>
            <span><i className={styles.highDot} /> Realisasi tertinggi</span>
            <span><i className={styles.lowDot} /> Realisasi terendah</span>
          </div>
        </div>
      </div>

      <footer className={styles.footer}>
        <span><i className={styles.highDot} /> Mode aktif: <strong>{mode === "highest" ? "Tertinggi" : "Terendah"}</strong></span>
        <span><Icon name="refresh" size={14} /> Host-to-Host: <strong>Online</strong></span>
        <em>Update: 2026 Q1</em>
      </footer>
    </section>
  );
}
