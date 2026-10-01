import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef
} from "react";

import { createRoot } from "react-dom/client";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker
} from "react-simple-maps";

import worldData50m from "world-atlas/countries-50m.json";
import worldData110m from "world-atlas/countries-110m.json";

import Strands from "./Strands";

import "./styles.css";


/* =========================================================
   ASEAN DATA
   ========================================================= */

const ASEAN = [
  {
    name: "Brunei",
    code: "BRN",
    mapId: "096",
    center: [114.7, 4.6],
    risk: "Medium",
    priority: 46,
    affected: 4200,
    deaths: 18,
    homes: 630,
    need: "Shelter & water",
    update: "Flood risk monitored"
  },

  {
    name: "Cambodia",
    code: "KHM",
    mapId: "116",
    center: [104.9, 12.6],
    risk: "High",
    priority: 72,
    affected: 38700,
    deaths: 41,
    homes: 5200,
    need: "Food & clean water",
    update: "River levels rising"
  },

  {
    name: "Indonesia",
    code: "IDN",
    mapId: "360",
    center: [117.0, -2.5],
    risk: "Critical",
    priority: 91,
    affected: 142000,
    deaths: 184,
    homes: 24800,
    need: "Medical & shelter",
    update: "Multiple sites affected"
  },

  {
    name: "Laos",
    code: "LAO",
    mapId: "418",
    center: [103.8, 18.2],
    risk: "High",
    priority: 69,
    affected: 29600,
    deaths: 27,
    homes: 4100,
    need: "Food & medicine",
    update: "Road access limited"
  },

  {
    name: "Malaysia",
    code: "MYS",
    mapId: "458",
    center: [109.7, 4.2],
    risk: "Medium",
    priority: 52,
    affected: 11800,
    deaths: 9,
    homes: 1700,
    need: "Water & transport",
    update: "Localized flooding"
  },

  {
    name: "Myanmar",
    code: "MMR",
    mapId: "104",
    center: [96.7, 20.9],
    risk: "Critical",
    priority: 95,
    affected: 218000,
    deaths: 312,
    homes: 41200,
    need: "Emergency medical aid",
    update: "Severe humanitarian need"
  },

  {
    name: "Philippines",
    code: "PHL",
    mapId: "608",
    center: [122.5, 12.2],
    risk: "Critical",
    priority: 88,
    affected: 186500,
    deaths: 226,
    homes: 31900,
    need: "Food, water & shelter",
    update: "Typhoon response active"
  },

  {
    name: "Singapore",
    code: "SGP",
    mapId: "702",
    center: [103.82, 1.35],
    risk: "Low",
    priority: 18,
    affected: 1800,
    deaths: 1,
    homes: 80,
    need: "Monitoring",
    update: "No major disruption"
  },

  {
    name: "Thailand",
    code: "THA",
    mapId: "764",
    center: [101.0, 15.0],
    risk: "High",
    priority: 63,
    affected: 52100,
    deaths: 38,
    homes: 8300,
    need: "Water & sanitation",
    update: "Flood response ongoing"
  },

  {
    name: "Timor-Leste",
    code: "TLS",
    mapId: "626",
    center: [125.9, -8.8],
    risk: "Medium",
    priority: 49,
    affected: 7600,
    deaths: 12,
    homes: 920,
    need: "Food & shelter",
    update: "Needs assessment active"
  },

  {
    name: "Vietnam",
    code: "VNM",
    mapId: "704",
    center: [107.8, 15.8],
    risk: "Critical",
    priority: 82,
    affected: 109400,
    deaths: 117,
    homes: 17300,
    need: "Shelter & medical",
    update: "Storm impacts expanding"
  }
];


/* =========================================================
   COUNTRY / STRAND CONFIGURATION
   ========================================================= */

const countryZoom = {
  // SGP always renders from the 50m file (see CountryMap), so
  // this zoom value is tuned for that resolution.
  SGP: 16000,
  BRN: 5000,
  TLS: 5000
};

const riskClass = (risk) =>
  risk.toLowerCase();

const COMMUNICATION_CHANNELS = [
  { id: "internet", name: "Internet / API", icon: "↗", status: "ONLINE", tone: "online", detail: "AHA Centre, national agencies, GIS and partner APIs" },
  { id: "cellular", name: "Cellular", icon: "◉", status: "AVAILABLE", tone: "online", detail: "Mobile data when local cellular infrastructure is operational" },
  { id: "sms", name: "SMS", icon: "✉", status: "FALLBACK", tone: "fallback", detail: "Structured emergency reports through SMS gateways" },
  { id: "radio", name: "Radio", icon: "◌", status: "RELAY", tone: "relay", detail: "Responder radio relay to a connected command post" },
  { id: "satellite", name: "Satellite", icon: "◒", status: "RESILIENT", tone: "resilient", detail: "Satellite / VSAT connectivity where terrestrial networks fail" },
  { id: "offline", name: "Offline Queue", icon: "□", status: "NO SIGNAL", tone: "offline", detail: "Stores reports locally and synchronizes when a connection returns" }
];

const SITE_OFFSETS = {
  BRN: [[0.22, 0.08], [-0.12, 0.18], [0.08, -0.12]],
  KHM: [[0.55, 0.25], [-0.45, 0.05], [0.12, -0.45]],
  IDN: [[1.7, 0.7], [-1.6, -0.1], [0.3, -1.0]],
  LAO: [[0.45, 0.4], [-0.35, 0.15], [0.15, -0.45]],
  MYS: [[1.2, 0.5], [-0.9, -0.1], [0.35, -0.65]],
  MMR: [[1.0, 0.8], [-0.9, 0.15], [0.2, -0.9]],
  PHL: [[-0.8, 2.2], [-1.9, 2.9], [-1.5, 4.0]],
  SGP: [[0.035, 0.025], [-0.04, 0.0], [0.02, -0.035]],
  THA: [[0.7, 0.45], [-0.65, 0.1], [0.15, -0.55]],
  TLS: [[0.35, 0.18], [-0.28, 0.05], [0.05, -0.18]],
  VNM: [[0.75, 0.6], [-0.65, 0.05], [0.15, -0.8]]
};

function buildSitesForCountry(country) {
  if (country.code === "PHL") {
    return baseSites.map((site) => ({ ...site }));
  }

  const offsets = SITE_OFFSETS[country.code] ?? [[0.3, 0.2], [-0.25, 0], [0.1, -0.25]];
  const baseImpact = Math.max(10, Math.round(country.affected / 180));

  return offsets.map(([lon, lat], index) => ({
    id: index + 1,
    short: String.fromCharCode(65 + index),
    name: `${country.name} — ${["Priority Zone", "Relief Corridor", "Community Cluster"][index]}`,
    casualties: Math.max(8, Math.round(baseImpact * [1.0, 0.35, 0.65][index])),
    homes: Math.max(40, Math.round(country.homes * [0.65, 0.2, 0.4][index])),
    aid: [48, 18, 30][index],
    budget: [42, 12, 24][index],
    workforce: [38, 16, 28][index],
    urgency: Math.min(100, country.priority + [2, -12, -5][index]),
    vulnerability: [78, 68, 73][index],
    access: [55, 82, 66][index],
    coords: [country.center[0] + lon, country.center[1] + lat]
  }));
}


/*
 * The website itself stays the same color.
 *
 * Only the Strands react to priority.
 */

const strandConfigByRisk = {
  critical: {
    colors: [
      "#DC2626",
      "#EF4444",
      "#F87171"
    ],

    speed: 1.15,
    amplitude: 1.05,
    intensity: 0.90
  },

  high: {
    colors: [
      "#EA580C",
      "#F97316",
      "#FB923C"
    ],

    speed: 0.80,
    amplitude: 0.90,
    intensity: 0.78
  },

  medium: {
    colors: [
      "#0891B2",
      "#06B6D4",
      "#38DF8"
    ],

    speed: 0.50,
    amplitude: 0.75,
    intensity: 0.65
  },

  low: {
    colors: [
      "#1E3A8A",
      "#2563EB",
      "#3B82F6"
    ],

    speed: 0.25,
    amplitude: 0.55,
    intensity: 0.45
  }
};


/* =========================================================
   COUNTRY MAP
   ========================================================= */

const CountryMap = memo(function CountryMap({
  country,
  active = false,
  dashboard = false,
  sites = [],
  onCountryClick
}) {
  const scale =
    dashboard
      ? (
          countryZoom[country.code] ??
          720
        )
      : (
          countryZoom[country.code]
            ? (
                active
                  ? countryZoom[country.code]
                  : countryZoom[country.code] * 0.7
              )
            : (
                active
                  ? 850
                  : 620
              )
        );

  const width =
    dashboard
      ? 820
      : active
        ? 520
        : 300;

  const height =
    dashboard
      ? 430
      : active
        ? 350
        : 230;

  return (
    <div
      className={`country-map ${
        active ? "active" : ""
      } ${
        dashboard
          ? "dashboard-map"
          : ""
      }`}
    >
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: country.center,
          scale
        }}
        width={width}
        height={height}
      >
        <defs>

          <filter
            id={`glow-${country.code}-${
              dashboard
                ? "dash"
                : "hero"
            }`}
          >
            <feGaussianBlur
              stdDeviation="3.5"
              result="blur"
            />

            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient
            id={`siteGlow-${country.code}`}
          >
            <stop
              offset="0%"
              stopColor="#ff5a3d"
              stopOpacity=".85"
            />

            <stop
              offset="100%"
              stopColor="#ff5a3d"
              stopOpacity="0"
            />
          </radialGradient>

        </defs>

        <Geographies
          /*
           * Hybrid resolution: the center map (active) and the
           * dashboard map are what people actually look closely
           * at, so they get the full 50m detail. The two blurred
           * side-thumbnails in the carousel never show that
           * detail anyway, so they use the much lighter 110m
           * file — that's where nearly all the transition-perf
           * cost was coming from (up to six maps mounted at
           * once mid-transition). Singapore is forced to 50m
           * always: its geometry is nearly degenerate at 110m
           * resolution and won't render recognizably otherwise.
           */
          geography={
            active || dashboard || country.code === "SGP"
              ? worldData50m
              : worldData110m
          }
        >
          {({
            geographies
          }) =>
            geographies.map(
              (geo) => {

                const geoId =
                  String(
                    geo.id
                  ).padStart(
                    3,
                    "0"
                  );

                const isTarget =
                  geoId ===
                  String(
                    country.mapId
                  ).padStart(
                    3,
                    "0"
                  );

                return (
                  <Geography
                    key={
                      geo.rsmKey
                    }
                    geography={
                      geo
                    }

                    /*
                     * PERF: only the target country is
                     * ever clickable, so only it needs a
                     * handler. Skipping this for the other
                     * ~250 geographies avoids allocating a
                     * new closure (and DOM listener) for
                     * every one of them on every render of
                     * every map instance — multiplied by up
                     * to six concurrent maps during a
                     * transition, that's real work saved.
                     */
                    onClick={
                      isTarget
                        ? () => {
                            if (
                              onCountryClick
                            ) {
                              onCountryClick(
                                country.code
                              );
                            }
                          }
                        : undefined
                    }

                    style={{
                      default: {
                        fill:
                          isTarget
                            ? (
                                active ||
                                dashboard
                              )
                              ? "#1677ff"
                              : "#123f78"
                            : "rgba(255,255,255,0.025)",

                        stroke:
                          isTarget
                            ? (
                                active ||
                                dashboard
                              )
                              ? "#ffffff"
                              : "rgba(116,183,255,.35)"
                            : "rgba(255,255,255,.02)",

                        strokeWidth:
                          isTarget
                            ? (
                                active ||
                                dashboard
                              )
                              ? 1.7
                              : 0.9
                            : 0.25,

                        outline:
                          "none",

                        /*
                         * Only active maps get
                         * the expensive SVG glow.
                         */
                        filter:
                          isTarget &&
                          (
                            active ||
                            dashboard
                          )
                            ? `url(#glow-${country.code}-${
                                dashboard
                                  ? "dash"
                                  : "hero"
                              })`
                            : "none"
                      },

                      hover: {
                        fill:
                          isTarget
                            ? "#2388ff"
                            : "rgba(255,255,255,.025)",

                        stroke:
                          isTarget
                            ? "#fff"
                            : "rgba(255,255,255,.02)",

                        outline:
                          "none"
                      },

                      pressed: {
                        fill:
                          isTarget
                            ? "#2388ff"
                            : "rgba(255,255,255,.025)",

                        outline:
                          "none"
                      }
                    }}
                  />
                );
              }
            )
          }
        </Geographies>

        {dashboard &&
          sites.map(
            (site) => (
              <Marker
                key={site.id}
                coordinates={
                  site.coords
                }
              >
                <circle
                  r="14"
                  fill={`url(#siteGlow-${country.code})`}
                  opacity=".55"
                />

                <circle
                  r="6"
                  fill={
                    site.score >= 75
                      ? "#ff4f37"
                      : site.score >= 50
                        ? "#ffb34f"
                        : "#47d79a"
                  }
                  stroke="#fff"
                  strokeWidth="2"
                />

                <text
                  textAnchor="middle"
                  y="-13"
                  className="map-marker-label"
                >
                  {site.short}
                </text>
              </Marker>
            )
          )}
      </ComposableMap>
    </div>
  );
});


/* =========================================================
   ARROW
   ========================================================= */

function Arrow({
  direction,
  onClick
}) {
  return (
    <button
      type="button"
      className="carousel-arrow"
      onClick={onClick}
      aria-label={`${direction} country`}
    >
      {direction === "left"
        ? "‹"
        : "›"}
    </button>
  );
}


/* =========================================================
   MAIN APP
   ========================================================= */

function App() {
  const [
    index,
    setIndex
  ] = useState(6);

  const [
    showDashboard,
    setShowDashboard
  ] = useState(false);

  const [
    direction,
    setDirection
  ] = useState("next");

  const [
    transitioning,
    setTransitioning
  ] = useState(false);

  const [
    incomingIndex,
    setIncomingIndex
  ] = useState(null);

  const transitionTimer =
    useRef(null);


  /*
   * Current country
   */

  const selected =
    ASEAN[index];


  /*
   * Current Strand configuration.
   *
   * This changes the PROPS,
   * but the Strands component itself
   * stays mounted.
   */

  const strandConfig =
    strandConfigByRisk[
      selected.risk.toLowerCase()
    ] ??
    strandConfigByRisk.medium;


  /*
   * Current visible countries.
   */

  const visibleCountries =
    useMemo(
      () => ({
        previous:
          ASEAN[
            (
              index -
              1 +
              ASEAN.length
            ) %
              ASEAN.length
          ],

        selected,

        next:
          ASEAN[
            (
              index +
              1
            ) %
              ASEAN.length
          ]
      }),

      [index, selected]
    );


  /*
   * Incoming countries during transition.
   */

  const incomingCountries =
    useMemo(() => {
      if (
        incomingIndex ===
        null
      ) {
        return null;
      }

      const incomingSelected =
        ASEAN[
          incomingIndex
        ];

      return {
        previous:
          ASEAN[
            (
              incomingIndex -
              1 +
              ASEAN.length
            ) %
              ASEAN.length
          ],

        selected:
          incomingSelected,

        next:
          ASEAN[
            (
              incomingIndex +
              1
            ) %
              ASEAN.length
          ]
      };
    }, [incomingIndex]);


  /*
   * Cleanup transition timer.
   */

  useEffect(() => {
    return () => {
      if (
        transitionTimer.current
      ) {
        window.clearTimeout(
          transitionTimer.current
        );
      }
    };
  }, []);


  /*
   * Country navigation.
   */

  const move = (step) => {
    if (
      transitioning
    ) {
      return;
    }

    const nextIndex =
      (
        index +
        step +
        ASEAN.length
      ) %
      ASEAN.length;

    setDirection(
      step > 0
        ? "next"
        : "prev"
    );

    setIncomingIndex(
      nextIndex
    );

    setTransitioning(
      true
    );

    transitionTimer.current =
      window.setTimeout(
        () => {
          setIndex(
            nextIndex
          );

          setIncomingIndex(
            null
          );

          setTransitioning(
            false
          );
        },
        500
      );
  };


  /*
   * Select a country directly.
   */

  const selectCountry =
    (code) => {
      const targetIndex =
        ASEAN.findIndex(
          (country) =>
            country.code ===
            code
        );

      if (
        targetIndex === -1 ||
        targetIndex === index ||
        transitioning
      ) {
        return;
      }

      /*
       * Use the shortest direction
       * around the ASEAN carousel.
       */

      let step =
        targetIndex -
        index;

      if (
        step >
        ASEAN.length / 2
      ) {
        step -=
          ASEAN.length;
      }

      if (
        step <
        -ASEAN.length / 2
      ) {
        step +=
          ASEAN.length;
      }

      move(step);
    };


  /*
   * PERF: give the country-click handler a permanently
   * stable identity.
   *
   * `selectCountry` above is recreated on every App render
   * (it closes over `index`/`transitioning`), so passing it
   * directly as a prop would change the `onCountryClick`
   * prop's reference on every render and defeat the
   * `React.memo` on `CountryMap` for all six maps at once —
   * exactly during the transitions where avoiding extra
   * work matters most.
   *
   * Same pattern as `Strands`: the latest logic lives in a
   * ref, and the function actually handed down to children
   * never changes identity, so `CountryMap` can now
   * genuinely skip re-rendering when its own props haven't
   * changed.
   */
  const selectCountryRef =
    useRef(selectCountry);

  selectCountryRef.current =
    selectCountry;

  const stableSelectCountry =
    useCallback(
      (code) => {
        selectCountryRef.current(
          code
        );
      },
      []
    );


  return (
    <main className="app-shell">

      <div className="noise" />


      {/* =====================================================
          TOP BAR
          ===================================================== */}

      <header className="topbar">

        <div className="brand">

          <img
            src="/react-logo.png"
            alt="REACT logo"
          />

          <div>
            <strong>
              REACT
            </strong>

            <span>
              Relief & Emergency
              Allocation
              Coordination
              Technology
            </span>
          </div>

        </div>

        <div className="status-pill">

          <span className="status-dot" />

          PROTOTYPE • ASEAN REGION

        </div>

      </header>


      {!showDashboard ? (

        /* =====================================================
           LANDING PAGE
           ===================================================== */

        <section className="landing">

          {/* =================================================
              STRANDS

              IMPORTANT:
              This component stays mounted.
              Only its props change.
              ================================================= */}

          <div className="landing-strands">

            <Strands

              colors={
                strandConfig.colors
              }

              count={3}

              speed={
                strandConfig.speed
              }

              amplitude={
                strandConfig.amplitude
              }

              waviness={1}

              thickness={0.7}

              glow={2.6}

              taper={3}

              spread={1}

              intensity={
                strandConfig.intensity
              }

              saturation={1.5}

              opacity={1}

              scale={1.5}

              glass={false}

              refraction={1}

              dispersion={1}

              glassSize={1}
            />

          </div>


          {/* =================================================
              GLOBE BACKGROUND
              ================================================= */}

          <div
            className="globe-orbit orbit-one"
          />

          <div
            className="globe-orbit orbit-two"
          />

          <div
            className="globe-core"
          />


          {/* =================================================
              HERO
              ================================================= */}

          <div className="hero-copy">

            <div className="eyebrow">
              AI-ASSISTED DISASTER
              RELIEF INTELLIGENCE
            </div>

            <h1>
              From disaster data
              <br />
              to smarter relief
              decisions.
            </h1>

            <p>
              REACT combines verified
              disaster information,
              needs assessment,
              dynamic priority scoring
              and resource availability
              to help responders decide
              what should go where —
              and when.
            </p>

          </div>


          {/* =================================================
              COUNTRY CAROUSEL
              ================================================= */}

          <div className="country-carousel">

            <Arrow
              direction="left"
              onClick={() =>
                move(-1)
              }
            />


            <div
              className={`country-stage-container ${
                transitioning
                  ? "is-transitioning"
                  : ""
              }`}
            >

              {/* =================================================
                  CURRENT COUNTRY
                  ================================================= */}

              <div
                className={`country-stage current-stage ${
                  transitioning
                    ? `transition-out-${direction}`
                    : ""
                }`}
              >

                <button
                  type="button"
                  className="side-country left"
                  onClick={() =>
                    move(-1)
                  }
                  aria-label={`Show ${visibleCountries.previous.name}`}
                >

                  <CountryMap
                    country={
                      visibleCountries.previous
                    }
                    onCountryClick={
                      stableSelectCountry
                    }
                  />

                  <span>
                    {
                      visibleCountries
                        .previous
                        .name
                    }
                  </span>

                </button>


                {/* CENTER COUNTRY */}

                <div className="center-country">

                  <CountryMap
                    country={
                      visibleCountries.selected
                    }
                    active
                    onCountryClick={
                      stableSelectCountry
                    }
                  />

                  <div className="country-label">

                    <span>
                      SELECTED REGION
                    </span>

                    <h2>
                      {
                        visibleCountries
                          .selected
                          .name
                      }
                    </h2>

                    <div
                      className={`risk-tag ${riskClass(
                        selected.risk
                      )}`}
                    >
                      {
                        selected.risk.toUpperCase()
                      }{" "}
                      PRIORITY
                    </div>

                  </div>

                </div>


                <button
                  type="button"
                  className="side-country right"
                  onClick={() =>
                    move(1)
                  }
                  aria-label={`Show ${visibleCountries.next.name}`}
                >

                  <CountryMap
                    country={
                      visibleCountries.next
                    }
                    onCountryClick={
                      stableSelectCountry
                    }
                  />

                  <span>
                    {
                      visibleCountries
                        .next
                        .name
                    }
                  </span>

                </button>

              </div>


              {/* =================================================
                  INCOMING COUNTRY

                  Only exists while transitioning.
                  ================================================= */}

              {incomingCountries && (

                <div
                  className={`country-stage incoming-stage transition-in-${direction}`}
                >

                  <button
                    type="button"
                    className="side-country left"
                    onClick={() =>
                      move(-1)
                    }
                    tabIndex={-1}
                    aria-hidden="true"
                  >

                    <CountryMap
                      country={
                        incomingCountries.previous
                      }
                      onCountryClick={
                        stableSelectCountry
                      }
                    />

                    <span>
                      {
                        incomingCountries
                          .previous
                          .name
                      }
                    </span>

                  </button>


                  <div className="center-country">

                    <CountryMap
                      country={
                        incomingCountries.selected
                      }
                      active
                      onCountryClick={
                        stableSelectCountry
                      }
                    />

                    <div className="country-label">

                      <span>
                        SELECTED REGION
                      </span>

                      <h2>
                        {
                          incomingCountries
                            .selected
                            .name
                        }
                      </h2>

                      <div
                        className={`risk-tag ${riskClass(
                          incomingCountries
                            .selected
                            .risk
                        )}`}
                      >
                        {
                          incomingCountries
                            .selected
                            .risk
                            .toUpperCase()
                        }{" "}
                        PRIORITY
                      </div>

                    </div>

                  </div>


                  <button
                    type="button"
                    className="side-country right"
                    onClick={() =>
                      move(1)
                    }
                    tabIndex={-1}
                    aria-hidden="true"
                  >

                    <CountryMap
                      country={
                        incomingCountries.next
                      }
                      onCountryClick={
                        stableSelectCountry
                      }
                    />

                    <span>
                      {
                        incomingCountries
                          .next
                          .name
                      }
                    </span>

                  </button>

                </div>

              )}

            </div>


            <Arrow
              direction="right"
              onClick={() =>
                move(1)
              }
            />

          </div>


          {/* =================================================
              BRAND
              ================================================= */}

          <div className="brand-lockup">

            <div className="wordmark">
              RE
              <span>
                A
              </span>
              CT
            </div>

            <div className="slogan">
              when disaster strikes,
              <b> REACT</b>
            </div>

          </div>


          {/* =================================================
              COMMAND CENTER
              ================================================= */}

          <button
            type="button"
            className="enter-button"
            onClick={() => {
              setShowDashboard(
                true
              );

              window.scrollTo({
                top: 0,
                behavior: "auto"
              });
            }}
          >
            Open Command Center
            <span>
              →
            </span>
          </button>


          <div className="carousel-hint">

            <span>
              ←
            </span>

            Browse ASEAN countries

            <span>
              →
            </span>

          </div>

        </section>

      ) : (

        /* =====================================================
           DASHBOARD
           ===================================================== */

        <Dashboard
          country={selected}
          onBack={() => {
            setShowDashboard(
              false
            );

            window.scrollTo({
              top: 0,
              behavior: "auto"
            });
          }}
        />

      )}


      {/* =====================================================
          FOOTER
          ===================================================== */}

      <footer className="footer">

        <span>
          REACT • Decision support,
          not autonomous deployment.
        </span>

        <span>
          AI recommends. Humans decide.
        </span>

      </footer>

    </main>
  );
}


/* =========================================================
   DASHBOARD DATA
   ========================================================= */

const baseSites = [
  {
    id: 1,
    short: "A",
    name: "Site A — Coastal District",
    casualties: 1000,
    homes: 1240,
    aid: 72,
    budget: 61,
    workforce: 45,
    urgency: 92,
    vulnerability: 86,
    access: 58,
    coords: [121.7, 14.4]
  },

  {
    id: 2,
    short: "B",
    name: "Site B — River Community",
    casualties: 30,
    homes: 180,
    aid: 12,
    budget: 8,
    workforce: 15,
    urgency: 61,
    vulnerability: 72,
    access: 80,
    coords: [120.6, 15.1]
  },

  {
    id: 3,
    short: "C",
    name: "Site C — Mountain Barangays",
    casualties: 420,
    homes: 690,
    aid: 38,
    budget: 24,
    workforce: 32,
    urgency: 84,
    vulnerability: 79,
    access: 36,
    coords: [121.0, 16.4]
  }
];


function scoreSite(
  site,
  maxCasualties,
  maxHomes
) {
  const impact =
    (
      (
        site.casualties /
        maxCasualties
      ) *
        0.65 +

      (
        site.homes /
        maxHomes
      ) *
        0.35
    ) *
    100;

  const unmet =
    (
      (
        100 -
        site.aid
      ) *
        0.55 +

      (
        100 -
        site.budget
      ) *
        0.2 +

      (
        100 -
        site.workforce
      ) *
        0.25
    );

  const accessibilityNeed =
    100 -
    site.access;

  const score =
    impact * 0.35 +
    unmet * 0.30 +
    site.urgency * 0.20 +
    site.vulnerability * 0.10 +
    accessibilityNeed * 0.05;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(score)
    )
  );
}


/* =========================================================
   DASHBOARD
   ========================================================= */

function Dashboard({
  country,
  onBack
}) {
  const [
    sites,
    setSites
  ] = useState(
    () => buildSitesForCountry(country)
  );

  const [
    toast,
    setToast
  ] = useState("");

  const [
    lastAction,
    setLastAction
  ] = useState(
    "Waiting for an allocation decision"
  );

  const [
    simulationTick,
    setSimulationTick
  ] = useState(0);

  const [
    activeChannel,
    setActiveChannel
  ] = useState("internet");

  const [
    channelState,
    setChannelState
  ] = useState("Ready");

  const [
    queuedReports,
    setQueuedReports
  ] = useState([]);

  const [
    syncedReports,
    setSyncedReports
  ] = useState(0);

  const toastTimer =
    useRef(null);

  useEffect(() => {
    setSites(buildSitesForCountry(country));
    setSimulationTick(0);
    setQueuedReports([]);
    setSyncedReports(0);
    setChannelState("Ready");
    setLastAction("Waiting for an allocation decision");
  }, [country.code]);

  useEffect(() => {
    return () => {
      window.clearTimeout(toastTimer.current);
    };
  }, []);


  const ranked =
    useMemo(() => {
      const maxCasualties =
        Math.max(
          ...sites.map(
            (s) =>
              s.casualties
          ),
          1
        );

      const maxHomes =
        Math.max(
          ...sites.map(
            (s) =>
              s.homes
          ),
          1
        );

      return sites
        .map(
          (site) => ({
            ...site,

            score:
              scoreSite(
                site,
                maxCasualties,
                maxHomes
              )
          })
        )
        .sort(
          (a, b) =>
            b.score -
            a.score
        );
    }, [sites]);


  const flash =
    (message) => {
      setToast(
        message
      );

      window.clearTimeout(
        toastTimer.current
      );

      toastTimer.current =
        window.setTimeout(
          () =>
            setToast(""),
          3200
        );
    };


  const dispatchAid =
    (id) => {
      const target =
        sites.find(
          (s) =>
            s.id === id
        );

      if (!target) {
        return;
      }

      setSites(
        (current) =>
          current.map(
            (site) =>
              site.id === id
                ? {
                    ...site,

                    aid:
                      Math.min(
                        100,
                        site.aid +
                          20
                      ),

                    budget:
                      Math.min(
                        100,
                        site.budget +
                          10
                      ),

                    workforce:
                      Math.min(
                        100,
                        site.workforce +
                          15
                      )
                  }
                : site
          )
      );

      setLastAction(
        `Allocation simulated for ${target.name}. Priority recalculated.`
      );

      flash(
        `Aid allocation recorded for ${target.short}. Priority will recalculate.`
      );
    };


  const simulateReport =
    () => {
      setSimulationTick(
        (t) => t + 1
      );

      setSites(
        (current) =>
          current.map(
            (site, i) =>
              i === 1
                ? {
                    ...site,

                    casualties:
                      site.casualties +
                      45,

                    homes:
                      site.homes +
                      120,

                    urgency:
                      Math.min(
                        100,
                        site.urgency +
                          12
                      )
                  }
                : site
          )
      );

      setLastAction(
        "New field report ingested: Site B needs increased."
      );

      flash(
        "New verified field report simulated. Priority queue updated."
      );
    };



  const ingestFieldReport =
    () => {
      const channel =
        COMMUNICATION_CHANNELS.find(
          (item) =>
            item.id ===
            activeChannel
        );

      if (!channel) return;

      const report = {
        id: `${Date.now()}-${activeChannel}`,
        channel: channel.name,
        time: new Date().toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit"
          }
        ),
        status:
          activeChannel === "offline"
            ? "QUEUED"
            : "SYNCED"
      };

      setChannelState(
        activeChannel === "offline"
          ? "Stored locally — waiting for connectivity"
          : "Report received and validated"
      );

      if (activeChannel === "offline") {
        setQueuedReports(
          (current) => [...current, report]
        );
        setLastAction(
          `Field report stored offline via ${channel.name}.`
        );
        flash(
          "No connection required: report queued locally for later synchronization."
        );
        return;
      }

      setSyncedReports(
        (count) => count + 1
      );

      setSites(
        (current) =>
          current.map(
            (site, index) =>
              index === 1
                ? {
                    ...site,
                    casualties:
                      site.casualties + 25,
                    homes:
                      site.homes + 80,
                    urgency:
                      Math.min(
                        100,
                        site.urgency + 8
                      )
                  }
                : site
          )
      );

      setLastAction(
        `Field report received via ${channel.name}. Priority recalculated.`
      );
      flash(
        `Report ingested through ${channel.name}. Priority queue updated.`
      );
    };


  const syncQueuedReports =
    () => {
      if (queuedReports.length === 0) {
        setChannelState("No queued reports");
        flash(
          "There are no offline reports waiting to synchronize."
        );
        return;
      }

      const amount =
        queuedReports.length;

      setSites(
        (current) =>
          current.map(
            (site, index) =>
              index === 1
                ? {
                    ...site,
                    casualties:
                      site.casualties +
                      25 * amount,
                    homes:
                      site.homes +
                      80 * amount,
                    urgency:
                      Math.min(
                        100,
                        site.urgency +
                          8 * amount
                      )
                  }
                : site
          )
      );

      setSyncedReports(
        (count) => count + amount
      );
      setQueuedReports([]);
      setChannelState(
        "Offline queue synchronized"
      );
      setLastAction(
        `${amount} queued field report${
          amount > 1 ? "s" : ""
        } synchronized. Priority recalculated.`
      );
      flash(
        `${amount} offline report${
          amount > 1 ? "s" : ""
        } synchronized successfully.`
      );
    };

  const resetSimulation =
    () => {
      setSites(
        buildSitesForCountry(country)
      );

      setSimulationTick(
        0
      );

      setQueuedReports([]);
      setSyncedReports(0);
      setChannelState("Ready");

      setLastAction(
        "Simulation reset to baseline conditions."
      );

      flash(
        "Priority simulation reset."
      );
    };


  const top =
    ranked[0];

  const topCountryPriority =
    Math.max(
      ...ranked.map(
        (s) =>
          s.score
      )
    );


  return (
    <section className="dashboard">

      <button
        type="button"
        className="back-button"
        onClick={onBack}
      >
        ← ASEAN overview
      </button>


      <div className="dashboard-header">

        <div>

          <div className="eyebrow">
            REACT COMMAND CENTER
          </div>

          <h1>
            {country.name}

            <span>
              • Decision Support Prototype
            </span>
          </h1>

          <p>
            REACT continuously
            reassesses need,
            impact, accessibility
            and aid coverage so
            limited resources can
            be redirected as the
            situation changes.
          </p>

        </div>

        <div className="ai-state">
          <span className="status-dot" />
          EXPLAINABLE AI ENGINE
        </div>

      </div>


      {/* =====================================================
          METRICS
          ===================================================== */}

      <div className="metric-grid">

        <Metric
          title="Affected population"
          value={
            country.affected.toLocaleString()
          }
          change="Verified / simulated"
        />

        <Metric
          title="Reported deaths"
          value={
            country.deaths.toLocaleString()
          }
          change="Impact indicator"
        />

        <Metric
          title="Homes damaged"
          value={
            country.homes.toLocaleString()
          }
          change="Impact indicator"
        />

        <Metric
          title="Highest site priority"
          value={`${topCountryPriority}/100`}
          change={
            topCountryPriority >= 75
              ? "CRITICAL"
              : "MONITOR"
          }
        />

      </div>


      {/* =====================================================
          RESILIENT DATA INTAKE
          ===================================================== */}

      <section className="panel resilience-panel">

        <div className="panel-title">

          <div>

            <span className="eyebrow">
              RESILIENT DATA INTAKE
            </span>

            <h2>
              How REACT receives information when networks fail
            </h2>

          </div>

          <span className="live-badge">
            PROTOTYPE SIMULATION
          </span>

        </div>


        <p className="resilience-intro">
          Field reports can enter through multiple communication paths.
          If no connection is available, REACT stores the report locally
          and synchronizes it when connectivity returns.
        </p>


        <div className="channel-grid">

          {COMMUNICATION_CHANNELS.map(
            (channel) => (

              <button
                type="button"
                key={channel.id}
                className={`channel-card ${
                  activeChannel === channel.id
                    ? "selected"
                    : ""
                } channel-${channel.tone}`}
                onClick={() => {
                  setActiveChannel(channel.id);
                  setChannelState(
                    channel.id === "offline"
                      ? "Offline mode selected"
                      : `${channel.name} selected`
                  );
                }}
              >

                <span className="channel-icon">
                  {channel.icon}
                </span>

                <span className="channel-copy">

                  <strong>
                    {channel.name}
                  </strong>

                  <small>
                    {channel.detail}
                  </small>

                </span>

                <span className="channel-status">
                  {channel.status}
                </span>

              </button>

            )
          )}

        </div>


        <div className="intake-actions">

          <button
            type="button"
            className="secondary-action"
            onClick={ingestFieldReport}
          >
            + Simulate field report
          </button>


          <button
            type="button"
            className="ghost-action"
            onClick={syncQueuedReports}
            disabled={queuedReports.length === 0}
          >
            Sync offline queue (
            {queuedReports.length}
            )
          </button>


          <span className="intake-state">
            {channelState} • {syncedReports} synced
          </span>

        </div>


        <div className="resilience-flow">

          <span>FIELD REPORT</span>
          <b>→</b>
          <span>AVAILABLE CHANNEL</span>
          <b>→</b>
          <span>REACT INGESTION</span>
          <b>→</b>
          <span>DYNAMIC PRIORITY</span>

        </div>

      </section>


      {/* =====================================================
          DASHBOARD GRID
          ===================================================== */}

      <div className="dashboard-grid">

        {/* PRIORITY ENGINE */}

        <section className="panel priority-panel">

          <div className="panel-title">

            <div>

              <span className="eyebrow">
                DYNAMIC PRIORITY ENGINE
              </span>

              <h2>
                Where should help
                go first?
              </h2>

            </div>

            <span className="live-badge">
              RECALCULATES LIVE
            </span>

          </div>


          <div className="simulation-controls">

            <button
              type="button"
              onClick={
                simulateReport
              }
              className="secondary-action"
            >
              ＋ Simulate new
              field report
            </button>

            <button
              type="button"
              onClick={
                resetSimulation
              }
              className="ghost-action"
            >
              Reset
            </button>

            <span className="simulation-status">
              Simulation cycle{" "}
              {simulationTick}
            </span>

          </div>


          <div className="priority-list">

            {ranked.map(
              (
                site,
                position
              ) => (

                <article
                  className={`priority-row ${
                    position === 0
                      ? "top-row"
                      : ""
                  }`}
                  key={
                    site.id
                  }
                >

                  <div className="rank">
                    {String(
                      position + 1
                    ).padStart(
                      2,
                      "0"
                    )}
                  </div>


                  <div className="site-info">

                    <strong>
                      {site.name}
                    </strong>

                    <span>
                      {site.casualties.toLocaleString()}
                      {" "}casualties •{" "}
                      {site.homes.toLocaleString()}
                      {" "}homes affected •{" "}
                      {site.access}%
                      {" "}access
                    </span>

                  </div>


                  <div className="priority-bar">

                    <div
                      style={{
                        width: `${site.score}%`
                      }}
                    />

                  </div>


                  <div className="score">

                    <strong>
                      {site.score}
                    </strong>

                    <span>
                      priority
                    </span>

                  </div>


                  <button
                    type="button"
                    className="dispatch"
                    onClick={() =>
                      dispatchAid(
                        site.id
                      )
                    }
                    aria-label={`Allocate aid to ${site.name}`}
                  >
                    Allocate aid
                  </button>

                </article>

              )
            )}

          </div>


          <div className="logic-box">

            <div className="logic-icon">
              AI
            </div>

            <div>

              <strong>
                Why the ranking
                changes
              </strong>

              <p>
                Prototype score
                combines human
                impact, unmet needs,
                urgency,
                vulnerability and
                accessibility.
                Recorded aid reduces
                unmet need, while new
                reports can increase
                urgency and impact.
              </p>

            </div>

          </div>


          <div className="factor-grid">

            <Factor
              label="Human impact"
              value="35%"
            />

            <Factor
              label="Unmet needs"
              value="30%"
            />

            <Factor
              label="Urgency"
              value="20%"
            />

            <Factor
              label="Vulnerability"
              value="10%"
            />

            <Factor
              label="Accessibility"
              value="5%"
            />

          </div>

        </section>


        {/* RIGHT STACK */}

        <aside className="right-stack">

          {/* MAP */}

          <section className="panel map-panel">

            <div className="panel-title">

              <div>

                <span className="eyebrow">
                  SITUATIONAL MAP
                </span>

                <h2>
                  {country.name}
                </h2>

              </div>

              <span className="live-badge">
                DEMO DATA
              </span>

            </div>


            <CountryMap
              country={country}
              dashboard
              sites={
                country.code ===
                "PHL"
                  ? ranked
                  : []
              }
            />


            <div className="map-legend">

              <span>
                <i className="legend-dot critical" />
                Critical
              </span>

              <span>
                <i className="legend-dot high" />
                High
              </span>

              <span>
                <i className="legend-dot monitored" />
                Monitored
              </span>

            </div>

          </section>


          {/* AI RECOMMENDATION */}

          <section className="panel allocation-panel">

            <div className="panel-title">

              <div>

                <span className="eyebrow">
                  AI RECOMMENDATION
                </span>

                <h2>
                  Suggested allocation
                </h2>

              </div>

            </div>


            <div className="recommendation">

              <div className="rec-top">

                <span>
                  TOP PRIORITY
                </span>

                <b>
                  {top.name}
                </b>

              </div>


              <Allocation
                label="Relief goods"
                value="35,000 packs"
              />

              <Allocation
                label="Clean water"
                value="70,000 L"
              />

              <Allocation
                label="Medical kits"
                value="2,400"
              />

              <Allocation
                label="Emergency workforce"
                value="84 people"
              />

              <Allocation
                label="Recommended budget"
                value="$180,000"
              />


              <button
                type="button"
                className="approve-button"
                onClick={() =>
                  dispatchAid(
                    top.id
                  )
                }
              >
                Simulate approval →
              </button>


              <small>
                AI recommends.
                Authorized responders
                approve, modify or
                reject.
              </small>

            </div>

          </section>

        </aside>

      </div>


      {/* =====================================================
          BOTTOM GRID
          ===================================================== */}

      <div className="bottom-grid">

        <section className="panel inventory-panel">

          <div className="panel-title">

            <div>

              <span className="eyebrow">
                RESOURCE READINESS
              </span>

              <h2>
                Available capacity
              </h2>

            </div>

            <span className="live-badge">
              ILLUSTRATIVE
            </span>

          </div>


          <Inventory
            label="Food packs"
            value={62000}
            max={100000}
          />

          <Inventory
            label="Clean water"
            value={74000}
            max={120000}
          />

          <Inventory
            label="Medical kits"
            value={8100}
            max={12000}
          />

          <Inventory
            label="Emergency workforce"
            value={168}
            max={250}
          />


          <div className="inventory-note">
            Coverage across
            connected warehouses /
            responders. Production
            version would ingest
            partner inventory APIs
            or operator updates.
          </div>

        </section>


        <section className="panel sources-panel">

          <div className="panel-title">

            <div>

              <span className="eyebrow">
                DATA FABRIC
              </span>

              <h2>
                What REACT would ingest
              </h2>

            </div>

          </div>


          <div className="source-row">

            <Source
              name="AHA Centre / ADINet"
              status="Historical & regional disaster records"
            />

            <Source
              name="National agencies"
              status="Forecasts, alerts & impact reports"
            />

            <Source
              name="GIS / population"
              status="Exposure, roads & vulnerability"
            />

            <Source
              name="Verified field reports"
              status="Current needs & aid received"
            />

          </div>


          <div className="confidence-box">

            <span className="confidence-ring">
              87%
            </span>

            <div>

              <strong>
                Recommendation confidence
              </strong>

              <p>
                Prototype value only.
                Production confidence
                would depend on source
                freshness, completeness
                and model validation.
              </p>

            </div>

          </div>

        </section>

      </div>


      {/* =====================================================
          HUMAN IN LOOP
          ===================================================== */}

      <div className="human-banner">

        <div>

          <span className="eyebrow">
            HUMAN-IN-THE-LOOP
          </span>

          <strong>
            AI recommends.
            Humans decide.
          </strong>

          <p>
            Field responders retain
            final authority because
            real-world conditions can
            change faster than any
            model.
          </p>

        </div>

        <div className="last-action">
          {lastAction}
        </div>

      </div>


      {toast && (
        <div className="toast">
          {toast}
        </div>
      )}

    </section>
  );
}


/* =========================================================
   SMALL COMPONENTS
   ========================================================= */

function Metric({
  title,
  value,
  change
}) {
  return (
    <div className="metric-card">

      <span>
        {title}
      </span>

      <strong>
        {value}
      </strong>

      <small>
        {change}
      </small>

    </div>
  );
}


function Allocation({
  label,
  value
}) {
  return (
    <div className="allocation-line">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


function Factor({
  label,
  value
}) {
  return (
    <div className="factor">

      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>

    </div>
  );
}


function Inventory({
  label,
  value,
  max
}) {
  const pct =
    Math.round(
      (value / max) *
        100
    );

  return (
    <div className="inventory-item">

      <div>

        <span>
          {label}
        </span>

        <strong>
          {value.toLocaleString()}
        </strong>

      </div>


      <div className="inventory-track">

        <div
          style={{
            width: `${pct}%`
          }}
        />

      </div>


      <small>
        {pct}% available
      </small>

    </div>
  );
}


function Source({
  name,
  status
}) {
  return (
    <div className="source-row-item">

      <div className="source-check">
        ✓
      </div>

      <div>

        <strong>
          {name}
        </strong>

        <span>
          {status}
        </span>

      </div>

    </div>
  );
}


/* =========================================================
   ROOT
   ========================================================= */

createRoot(
  document.getElementById(
    "root"
  )
).render(

  <React.StrictMode>

    <>
      <Loader />
      <App />
    </>

  </React.StrictMode>
);


/* =========================================================
   LOADER
   ========================================================= */

function Loader() {
  const [
    visible,
    setVisible
  ] = useState(true);

  const [
    moving,
    setMoving
  ] = useState(false);


  useEffect(() => {

    const startMove =
      window.setTimeout(
        () => {
          setMoving(
            true
          );
        },
        1200
      );


    const finish =
      window.setTimeout(
        () => {
          setVisible(
            false
          );
        },
        1900
      );


    return () => {

      window.clearTimeout(
        startMove
      );

      window.clearTimeout(
        finish
      );

    };

  }, []);


  if (!visible) {
    return null;
  }


  return (
    <div
      className={`loader-wrapper ${
        moving
          ? "loader-moving"
          : ""
      }`}
    >

      <img
        className="loader-logo"
        src="/react-logo.png"
        alt="REACT"
      />

    </div>
  );
}
