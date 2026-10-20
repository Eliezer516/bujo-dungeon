import { useState, useRef, useEffect, useCallback } from "react";
import { useWebHaptics } from "web-haptics/react";
import MarkdownIt from "markdown-it";
import "./App.css";
import reglas from "../reglas.md?raw";

const md = new MarkdownIt();

const TABLAS = ["sala", "puertas", "enemigos", "cofre", "contenido"];

const RESULTADOS = {
  sala: (r) =>
    r <= 2
      ? "3 casillas"
      : r <= 4
        ? "4 casillas"
        : r === 5
          ? "5 casillas"
          : "6 casillas",
  puertas: (r) => (r <= 4 ? "+1 puerta" : "+2 puertas"),
  enemigos: (r) =>
    r <= 2 ? "1 enemigo" : r <= 4 ? "2 enemigos" : "3 enemigos",
  cofre: (r) => (r <= 3 ? "No hay cofre" : "Cofre abierto"),
  contenido: (r) =>
    r === 1
      ? "💥 Trampa (-1 HP)"
      : r === 2
        ? "Poción de Curación"
        : r === 3
          ? "Reparador de Escudo"
          : r === 4
            ? "Pergamino de Mejora"
            : "Bomba de Escape",
};

const ETIQUETAS = {
  sala: "Tamaño de Sala",
  puertas: "Puertas adicionales",
  enemigos: "Cantidad de enemigos",
  cofre: "Presencia de cofre",
  contenido: "Contenido del cofre",
  batalla: "Turno de Combate",
};

const ITEMS = {
  pocion: "🧪",
  reparador: "🛡️",
  bomba: "💣",
  pergamino: "📜",
};

const KITS = [
  {
    id: "clasico",
    nombre: "Clásico",
    icono: "🛡️",
    desc: "Equilibrado",
    items: ["pocion", "reparador", "bomba", null],
  },
  {
    id: "guerrero",
    nombre: "Guerrero",
    icono: "⚔️",
    desc: "Tanque",
    items: ["reparador", "reparador", "pocion", null],
  },
  {
    id: "explorador",
    nombre: "Explorador",
    icono: "🦶",
    desc: "Evasivo",
    items: ["bomba", "bomba", "pocion", null],
  },
  {
    id: "alquimista",
    nombre: "Alquimista",
    icono: "🧪",
    desc: "Supervivencia",
    items: ["pocion", "pocion", "reparador", null],
  },
];

const TIPOS_ENEMIGO = {
  bicho: { nombre: "Bicho", icono: "🐛", hp: 1 },
  bruto: { nombre: "Bruto", icono: "🧟", hp: 2 },
  demonio: { nombre: "Demonio", icono: "👹", hp: 3 },
  jefe: { nombre: "Jefe Final", icono: "🐉", hp: 5 },
};

// Escalado según el número de sala recorrida (ver reglas.md).
function escaladoDe(sala, d6) {
  if (sala <= 5) return "bicho";
  if (sala <= 15) return d6 <= 3 ? "bicho" : "bruto";
  if (sala <= 25) return d6 <= 3 ? "bruto" : "demonio";
  return "demonio";
}

function descripcionEscalado(sala) {
  if (sala <= 5) return "Bicho 🐛 · 1 HP";
  if (sala <= 15) return "d6: 1-3 Bicho 🐛 (1) / 4-6 Bruto 🧟 (2)";
  if (sala <= 25) return "d6: 1-3 Bruto 🧟 (2) / 4-6 Demonio 👹 (3)";
  return "Demonio 👹 · 3 HP";
}

function rollD6() {
  return Math.ceil(Math.random() * 6);
}

function useRolling() {
  const [rolling, setRolling] = useState(false);
  const intervalRef = useRef(null);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRolling(false);
  }, []);

  const start = useCallback(
    (onTick, onDone, ticks = 12, delay = 60) => {
      stop();
      setRolling(true);
      let count = 0;
      intervalRef.current = setInterval(() => {
        onTick?.();
        if (++count >= ticks) {
          onDone?.();
          stop();
        }
      }, delay);
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  return { rolling, start, stop };
}

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // almacenamiento no disponible
    }
  }, [key, value]);

  return [value, setValue];
}

function App() {
  const { trigger, isSupported } = useWebHaptics({
    debug: true,
  });
  useEffect(() => {
    console.log({ isSupported });
  }, []);

  const [modoTodo, setModoTodo] = useLocalStorage("bujo:modoTodo", false);
  const [botonesStats, setBotonesStats] = useLocalStorage(
    "bujo:botonesStats",
    false,
  );
  const [configOpen, setConfigOpen] = useState(false);
  const [reglasOpen, setReglasOpen] = useState(false);
  const [kitOpen, setKitOpen] = useState(false);

  const [etiqueta, setEtiqueta] = useLocalStorage(
    "bujo:etiqueta",
    "Tira un dado",
  );
  const [dado, setDado] = useLocalStorage("bujo:dado", "-");
  const [resultado, setResultado] = useLocalStorage("bujo:resultado", "-");
  const [cartasTodo, setCartasTodo] = useLocalStorage("bujo:cartasTodo", []);
  const [combate, setCombate] = useLocalStorage("bujo:combate", null);
  const [cofreAbierto, setCofreAbierto] = useLocalStorage(
    "bujo:cofreAbierto",
    false,
  );
  const [salas, setSalas] = useLocalStorage("bujo:salas", 0);

  const [stats, setStats] = useLocalStorage("bujo:stats", {
    hp: 10,
    hpMax: 10,
    fuerza: 3,
    escudo: 3,
    escudoMax: 3,
    mochila: 4,
  });
  const [inventario, setInventario] = useLocalStorage("bujo:inventario", [
    null,
    null,
    null,
    null,
  ]);
  const [slotSeleccionado, setSlotSeleccionado] = useState(-1);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [nuevoCombate, setNuevoCombate] = useState({ enemigos: 1 });
  const [combateModalOpen, setCombateModalOpen] = useState(false);
  const [combateDado, setCombateDado] = useState("-");
  const [modoJefe, setModoJefe] = useLocalStorage("bujo:modoJefe", false);
  const [pergaminoSlot, setPergaminoSlot] = useState(-1);
  const [pergaminoOpen, setPergaminoOpen] = useState(false);

  const { rolling, start } = useRolling();
  const combateRoll = useRolling();

  const ajustarInventario = useCallback((mochila) => {
    setInventario((prev) => {
      if (prev.length < mochila)
        return [...prev, ...Array(mochila - prev.length).fill(null)];
      return prev.slice(0, mochila);
    });
  }, []);

  const updateStat = (stat, delta) => {
    setStats((prev) => {
      const max =
        stat === "hp"
          ? (prev.hpMax ?? 10)
          : stat === "escudo"
            ? (prev.escudoMax ?? 3)
            : Infinity;
      const next = {
        ...prev,
        [stat]: Math.max(0, Math.min(max, prev[stat] + delta)),
      };
      if (stat === "mochila") ajustarInventario(next.mochila);
      return next;
    });
  };

  const iniciarPartida = (kit) => {
    setStats({ hp: 10, hpMax: 10, fuerza: 3, escudo: 3, escudoMax: 3, mochila: 4 });
    setInventario([...kit.items]);
    setSalas(0);
    setCartasTodo([]);
    setCombate(null);
    setCofreAbierto(false);
    setEtiqueta("Nueva partida");
    setDado("-");
    setResultado("-");
    setKitOpen(false);
    trigger("success");
  };

  const numEnemigosDe = (res) => parseInt(res, 10) || 1;

  const iniciarCombate = (n, sala = salas) => {
    const enemigos = Math.max(1, Math.min(6, n));
    const tipos = [];
    const hp = [];
    const hpMax = [];
    for (let i = 0; i < enemigos; i++) {
      const tipo = escaladoDe(sala, rollD6());
      tipos.push(tipo);
      hp.push(TIPOS_ENEMIGO[tipo].hp);
      hpMax.push(TIPOS_ENEMIGO[tipo].hp);
    }
    setCombate({
      enemigos,
      tipos,
      hp,
      hpMax,
      turno: 0,
      ronda: 1,
      escudo: true,
      ultimo: null,
      esJefe: false,
    });
    trigger("success");
  };

  const toggleJefe = (on) => {
    setModoJefe(on);
    if (on) {
      setCombate({
        enemigos: 1,
        tipos: ["jefe"],
        hp: [TIPOS_ENEMIGO.jefe.hp],
        hpMax: [TIPOS_ENEMIGO.jefe.hp],
        turno: 0,
        ronda: 1,
        escudo: true,
        ultimo: null,
        esJefe: true,
      });
      trigger("heavy");
    } else {
      terminarCombate();
    }
  };

  const terminarCombate = () => {
    setCombate(null);
    setModoJefe(false);
    setEtiqueta("Tira un dado");
    setDado("-");
    setResultado("-");
  };

  const abrirCombate = () => {
    if (!combate && !modoTodo) {
      iniciarCombate(nuevoCombate.enemigos);
    }
    setCombateModalOpen(true);
  };

  const resolverTurno = () => {
    if (combateRoll.rolling) return;
    if (!combate) {
      iniciarCombate(nuevoCombate.enemigos);
      return;
    }
    const N = combate.enemigos;
    const esJugador = combate.turno < N;
    const idx = combate.turno - N;
    const finalR = rollD6();
    const golpea = finalR >= 4;
    const dmgJugador = 1 + (stats.fuerza - 3);
    const dmgAJugador = !esJugador && golpea && !combate.escudo ? 1 : 0;

    trigger("nudge");
    combateRoll.start(
      () => setCombateDado(rollD6()),
      () => {
        setCombateDado(finalR);
        setCombate((prev) => {
          if (!prev) return prev;
          const next = { ...prev, hp: [...prev.hp] };
          if (esJugador) {
            if (golpea) {
              const i = next.hp.findIndex((h) => h > 0);
              if (i !== -1) next.hp[i] = Math.max(0, next.hp[i] - dmgJugador);
              next.ultimo = {
                lado: "heroe",
                num: finalR,
                res: `Acierto (-${dmgJugador})`,
              };
            } else {
              next.ultimo = { lado: "heroe", num: finalR, res: "Fallo" };
            }
          } else if (golpea && next.escudo) {
            next.escudo = false;
            next.ultimo = {
              lado: "enemigo",
              idx,
              num: finalR,
              res: "Bloqueado (escudo)",
            };
          } else if (golpea) {
            next.ultimo = {
              lado: "enemigo",
              idx,
              num: finalR,
              res: "Golpe (-1 HP)",
            };
          } else {
            next.ultimo = { lado: "enemigo", idx, num: finalR, res: "Fallo" };
          }
          next.turno += 1;
          if (next.turno >= N * 2) {
            next.turno = 0;
            next.ronda += 1;
          }
          return next;
        });
        if (dmgAJugador) updateStat("hp", -dmgAJugador);
      },
    );
  };

  const tirar = (tabla) => {
    if (tabla === "batalla") {
      abrirCombate();
      return;
    }
    if (rolling) return;
    trigger("nudge");
    setCartasTodo([]);
    const finalR = rollD6();
    start(
      () => setDado(rollD6()),
      () => {
        setDado(finalR);
        setEtiqueta(ETIQUETAS[tabla]);
        setResultado(RESULTADOS[tabla](finalR));
        if (tabla === "sala") setSalas((n) => n + 1);
        if (tabla === "enemigos")
          setNuevoCombate((prev) => ({
            ...prev,
            enemigos: numEnemigosDe(RESULTADOS.enemigos(finalR)),
          }));
      },
    );
  };

  const tirarTodo = () => {
    if (rolling) return;
    trigger("nudge");
    setEtiqueta("Tira un dado");
    setDado("-");
    setResultado("-");
    setCombate(null);
    setCofreAbierto(false);
    setSalas((n) => n + 1);

    const resultados = {};
    TABLAS.forEach((t) => (resultados[t] = rollD6()));

    const hayCofre = resultados["cofre"] > 3;
    const nEnemigos = numEnemigosDe(RESULTADOS.enemigos(resultados.enemigos));
    setNuevoCombate((prev) => ({ ...prev, enemigos: nEnemigos }));

    start(
      () => {
        setDado(rollD6());
        setCartasTodo(
          TABLAS.map((t) => {
            const r = rollD6();
            return { tabla: t, num: r, res: RESULTADOS[t](r) };
          }).filter(({ tabla }) => tabla !== "contenido"),
        );
      },
      () => {
        setEtiqueta("Exploración completa");
        setDado("🎲");
        setResultado("");
        setCartasTodo(
          TABLAS.map((t) => ({
            tabla: t,
            num: resultados[t],
            res:
              t === "contenido" && hayCofre
                ? "Cerrado"
                : RESULTADOS[t](resultados[t]),
            contenidoReal:
              t === "contenido" ? RESULTADOS[t](resultados[t]) : undefined,
          })).filter(({ tabla }) => {
            if (tabla !== "contenido") return true;
            return hayCofre;
          }),
        );
      },
    );
  };

  const usarItem = (index) => {
    const item = inventario[index];
    if (!item) {
      setSlotSeleccionado(index);
      setPickerOpen(true);
      return;
    }

    // El reparador solo se usa entre salas o con el escudo a 0.
    if (item === "reparador" && combate && stats.escudo > 0) {
      trigger("error");
      return;
    }

    if (item === "pergamino") {
      setPergaminoSlot(index);
      setPergaminoOpen(true);
      return;
    }

    trigger("nudge");
    if (item === "pocion") {
      setStats((p) => ({
        ...p,
        hp: Math.min(p.hpMax ?? 10, p.hp + 3),
      }));
      // En combate, la poción gasta el turno del héroe.
      if (combate && combate.turno < combate.enemigos) {
        setCombate((prev) => {
          if (!prev) return prev;
          const next = { ...prev, turno: prev.turno + 1 };
          if (next.turno >= prev.enemigos * 2) {
            next.turno = 0;
            next.ronda = prev.ronda + 1;
          }
          return next;
        });
      }
    } else if (item === "reparador") {
      setStats((p) => ({ ...p, escudo: p.escudoMax ?? 3 }));
    } else if (item === "bomba") {
      setStats((p) => ({ ...p, hp: Math.max(0, p.hp - 1) }));
      terminarCombate();
    }
    setInventario((prev) => prev.map((v, i) => (i === index ? null : v)));
  };

  const descartarSlot = (index) => {
    setInventario((prev) => prev.map((v, i) => (i === index ? null : v)));
    trigger("warning");
  };

  const cerrarPergamino = () => {
    setPergaminoOpen(false);
    setPergaminoSlot(-1);
  };

  const aplicarPergamino = (tipo) => {
    if (tipo === "hp") {
      setStats((p) => ({
        ...p,
        hpMax: (p.hpMax ?? 10) + 2,
        hp: p.hp + 2,
      }));
    } else if (tipo === "fuerza") {
      setStats((p) => ({ ...p, fuerza: p.fuerza + 1 }));
    } else if (tipo === "escudo") {
      setStats((p) => ({
        ...p,
        escudoMax: (p.escudoMax ?? 3) + 1,
        escudo: p.escudo + 1,
      }));
    } else if (tipo === "mochila") {
      const nueva = (stats.mochila ?? 4) + 1;
      setStats((p) => ({ ...p, mochila: nueva }));
      setInventario((prev) => [...prev, null]);
    }
    if (pergaminoSlot !== -1) {
      setInventario((prev) =>
        prev.map((v, i) => (i === pergaminoSlot ? null : v)),
      );
    }
    setPergaminoOpen(false);
    setPergaminoSlot(-1);
    trigger("success");
  };

  const seleccionarItem = (tipo) => {
    if (slotSeleccionado !== -1) {
      setInventario((prev) =>
        prev.map((v, i) => (i === slotSeleccionado ? tipo : v)),
      );
    }
    setPickerOpen(false);
    setSlotSeleccionado(-1);
  };

  const cerrarPicker = () => {
    setPickerOpen(false);
    setSlotSeleccionado(-1);
  };

  const totalTurnos = combate ? combate.enemigos * 2 : 0;
  const turnoActual = combate ? combate.turno : 0;
  const esTurnoJugador = combate ? turnoActual < combate.enemigos : true;
  const enemigosVivos = combate
    ? combate.hp.filter((h) => h > 0).length
    : 0;
  const secuenciaTurnos = [];
  if (combate) {
    for (let i = 0; i < combate.enemigos; i++)
      secuenciaTurnos.push({ tipo: "heroe", label: "Tú" });
    for (let i = 0; i < combate.enemigos; i++)
      secuenciaTurnos.push({ tipo: "enemigo", label: `E${i + 1}`, idx: i });
  }

  return (
    <div className="app-shell">
      <div className="pantalla">
        <div className="etiqueta">{etiqueta}</div>
        {!modoTodo && (
          <>
            <p className={`dado ${rolling ? "rolling" : ""}`}>{dado}</p>
            <div className="resultado">{resultado}</div>
          </>
        )}
        {modoTodo && (
          <>
            <div className="dado-multi">
              {cartasTodo.length > 0
                ? cartasTodo
                    .filter(({ tabla }) => tabla !== "contenido")
                    .map(({ tabla, num, res }) => (
                      <div className="dado-card" key={tabla}>
                        <div className="dc-label">{tabla}</div>
                        <div className="dc-num">{num}</div>
                        <div className="dc-res">{res}</div>
                      </div>
                    ))
                : TABLAS.map((t) => (
                    <div
                      className={`dado-card placeholder ${t === "contenido" ? "wide" : ""}`}
                      key={t}
                    >
                      <div className="dc-label">{t}</div>
                      <div className="dc-num">-</div>
                      <div className="dc-res"></div>
                    </div>
                  ))}
            </div>
            {cartasTodo.some((c) => c.tabla === "contenido") && (
              <div className="cofre-zone">
                <div className="dado-card wide">
                  <div className="dc-label">Contenido</div>
                  <div className="dc-num">
                    {cartasTodo.find((c) => c.tabla === "contenido").num}
                  </div>
                  <div className="dc-res">
                    {cofreAbierto
                      ? cartasTodo.find((c) => c.tabla === "contenido")
                          .contenidoReal
                      : "Cerrado"}
                  </div>
                </div>
                {!cofreAbierto && (
                  <button
                    className="action-btn cofre-btn"
                    onClick={() => {
                      const esTrampa = cartasTodo
                        .find((c) => c.tabla === "contenido")
                        .contenidoReal.includes("Trampa");
                      trigger(esTrampa ? "error" : "success");
                      setCofreAbierto(true);
                    }}
                    disabled={rolling}
                  >
                    Abrir Cofre
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className={`stats-panel${botonesStats ? " con-botones" : ""}`}>
        <div className="stat-row salas-row">
          <span className="stat-label">SALAS</span>
          <span className="stat-value">{salas}</span>
        </div>
        {["hp", "fuerza", "escudo"].map((stat) => {
          const val = stats[stat];
          const max =
            stat === "hp"
              ? (stats.hpMax ?? 10)
              : stat === "escudo"
                ? (stats.escudoMax ?? 3)
                : null;
          return (
            <div className="stat-row" key={stat}>
              <span className="stat-label">
                {stat === "hp" ? "HP" : stat === "fuerza" ? "FUE" : "ESC"}
              </span>
              {botonesStats && (
                <button
                  className="stat-btn minus"
                  onClick={() => updateStat(stat, -1)}
                  disabled={val <= 0}
                >
                  -
                </button>
              )}
              <span className="stat-value">
                {max !== null ? `${val}/${max}` : val}
              </span>
              {botonesStats && (
                <button
                  className="stat-btn plus"
                  onClick={() => updateStat(stat, 1)}
                  disabled={max !== null && val >= max}
                >
                  +
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="inventario-panel">
        {inventario.map((item, i) => (
          <div
            className={`slot ${item ? "filled" : "empty"}`}
            key={i}
            onClick={() => usarItem(i)}
            onContextMenu={(e) => {
              e.preventDefault();
              if (item) descartarSlot(i);
            }}
            title={item ? "Clic: usar · Clic largo: descartar" : "Añadir item"}
          >
            {item ? ITEMS[item] : ""}
          </div>
        ))}
      </div>

      <div className={`controles${modoTodo ? " controles-todo" : ""}`}>
        {!modoTodo && (
          <>
            <button
              className="action-btn"
              onClick={() => tirar("sala")}
              disabled={rolling}
            >
              Sala
            </button>
            <button
              className="action-btn"
              onClick={() => tirar("puertas")}
              disabled={rolling}
            >
              Puertas
            </button>
            <button
              className="action-btn"
              onClick={() => tirar("enemigos")}
              disabled={rolling}
            >
              Enemigos
            </button>
            <button
              className="action-btn"
              onClick={() => tirar("cofre")}
              disabled={rolling}
            >
              Cofre
            </button>
            <button
              className="action-btn"
              onClick={() => tirar("contenido")}
              disabled={rolling}
            >
              Contenido
            </button>
            <button
              className="action-btn"
              onClick={() => tirar("batalla")}
              disabled={rolling}
            >
              Batalla
            </button>
          </>
        )}
        {modoTodo && (
          <>
            <button
              className="action-btn"
              onClick={tirarTodo}
              disabled={rolling}
            >
              Tirar Todo
            </button>
            <button
              className="action-btn"
              onClick={() => tirar("batalla")}
              disabled={rolling}
            >
              Combate
            </button>
          </>
        )}
      </div>

      <button
        className="reglas-fab"
        onClick={() => setReglasOpen(true)}
        aria-label="Reglas"
      >
        ?
      </button>

      <button
        className="config-fab"
        onClick={() => setConfigOpen(true)}
        aria-label="Configuración"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="32"
          height="32"
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="m9.25 22l-.4-3.2q-.325-.125-.612-.3t-.563-.375L4.7 19.375l-2.75-4.75l2.575-1.95Q4.5 12.5 4.5 12.338v-.675q0-.163.025-.338L1.95 9.375l2.75-4.75l2.975 1.25q.275-.2.575-.375t.6-.3l.4-3.2h5.5l.4 3.2q.325.125.613.3t.562.375l2.975-1.25l2.75 4.75l-2.575 1.95q.025.175.025.338v.674q0 .163-.05.338l2.575 1.95l-2.75 4.75l-2.95-1.25q-.275.2-.575.375t-.6.3l-.4 3.2zm2.8-6.5q1.45 0 2.475-1.025T15.55 12t-1.025-2.475T12.05 8.5q-1.475 0-2.488 1.025T8.55 12t1.013 2.475T12.05 15.5"
          />
        </svg>
      </button>

      {configOpen && (
        <div className="modal-backdrop" onClick={() => setConfigOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Configuración</h2>
              <button
                className="modal-close"
                onClick={() => setConfigOpen(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <label className="config-toggle">
                <span>Modo "Tirar Todo"</span>
                <input
                  type="checkbox"
                  checked={modoTodo}
                  onChange={(e) => {
                    const activado = e.target.checked;
                    setModoTodo(activado);
                    if (activado) {
                      setCartasTodo([]);
                      setCombate(null);
                    }
                  }}
                />
                <span className="slider" />
              </label>
              <label className="config-toggle">
                <span>Botones de stats (+/-)</span>
                <input
                  type="checkbox"
                  checked={botonesStats}
                  onChange={(e) => setBotonesStats(e.target.checked)}
                />
                <span className="slider" />
              </label>
              <div className="config-info">
                <span>Retroalimentación háptica</span>
                <span className={`config-badge ${isSupported ? "ok" : "no"}`}>
                  {isSupported ? "Compatible" : "No compatible"}
                </span>
              </div>
              <button
                className="action-btn nueva-partida-btn"
                onClick={() => {
                  setConfigOpen(false);
                  setKitOpen(true);
                }}
              >
                Nueva Partida
              </button>
            </div>
          </div>
        </div>
      )}

      {kitOpen && (
        <div className="modal-backdrop" onClick={() => setKitOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Partida</h2>
              <button
                className="modal-close"
                onClick={() => setKitOpen(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="kit-intro">Elige tu kit de inicio:</p>
              <div className="kit-grid">
                {KITS.map((kit) => (
                  <button
                    key={kit.id}
                    className="kit-card"
                    onClick={() => iniciarPartida(kit)}
                  >
                    <span className="kit-icono">{kit.icono}</span>
                    <span className="kit-nombre">{kit.nombre}</span>
                    <span className="kit-desc">{kit.desc}</span>
                    <span className="kit-items">
                      {kit.items
                        .map((it, i) => (it ? ITEMS[it] : "·"))
                        .join(" ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {reglasOpen && (
        <div className="modal-backdrop" onClick={() => setReglasOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Reglas</h2>
              <button
                className="modal-close"
                onClick={() => setReglasOpen(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div
              className="modal-body reglas-body"
              dangerouslySetInnerHTML={{ __html: md.render(reglas) }}
            />
          </div>
        </div>
      )}

      {combateModalOpen && (
        <div className="modal-backdrop" onClick={() => setCombateModalOpen(false)}>
          <div
            className="modal-content combate-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Combate</h2>
              <label className="combate-switch">
                <span>Jefe</span>
                <input
                  type="checkbox"
                  checked={modoJefe}
                  onChange={(e) => toggleJefe(e.target.checked)}
                />
                <span className="slider" />
              </label>
              <button
                className="modal-close"
                onClick={() => setCombateModalOpen(false)}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className={`combate-die ${combateRoll.rolling ? "rolling" : ""}`}>
                {combateDado}
              </p>
              {combate ? (
                <>
                  <div className="combate-header">
                    Combate · Ronda {combate.ronda}
                  </div>
                  <div className="combate-turnos">
                    {secuenciaTurnos.map((s, i) => (
                      <span
                        key={i}
                        className={`turno ${s.tipo}${i === turnoActual ? " actual" : ""}`}
                      >
                        {s.label}
                      </span>
                    ))}
                  </div>
                  <div className="combate-ahora">
                    {enemigosVivos === 0
                      ? "¡Combate ganado!"
                      : esTurnoJugador
                        ? "Tu turno"
                        : `Turno del enemigo ${turnoActual - combate.enemigos + 1}`}
                  </div>
                  <div className="combate-enemigos">
                    {combate.hp.map((h, i) => (
                      <div
                        key={i}
                        className={`enemigo${h <= 0 ? " muerto" : ""}`}
                      >
                        <span className="enemigo-label">
                          {TIPOS_ENEMIGO[combate.tipos?.[i] ?? "bicho"].icono}{" "}
                          E{i + 1}
                        </span>
                        <span className="enemigo-hp">
                          {h <= 0
                            ? "💀"
                            : `${h}/${combate.hpMax[i]} ${TIPOS_ENEMIGO[
                                combate.tipos?.[i] ?? "bicho"
                              ].nombre}`}
                        </span>
                        {h > 0 && (
                          <span className="enemigo-ctrl">
                            <button
                              onClick={() =>
                                setCombate((p) => ({
                                  ...p,
                                  hp: p.hp.map((v, j) =>
                                    j === i ? Math.max(0, v - 1) : v,
                                  ),
                                }))
                              }
                            >
                              -
                            </button>
                            <button
                              onClick={() =>
                                setCombate((p) => ({
                                  ...p,
                                  hp: p.hp.map((v, j) =>
                                    j === i ? Math.min(p.hpMax[i], v + 1) : v,
                                  ),
                                }))
                              }
                            >
                              +
                            </button>
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  {combate.ultimo && (
                    <div className="combate-ultimo">
                      {combate.ultimo.res}
                      <span className="combate-dado">
                        ({combate.ultimo.num})
                      </span>
                    </div>
                  )}
                  {enemigosVivos > 0 && (
                    <button
                      className="action-btn"
                      onClick={resolverTurno}
                      disabled={combateRoll.rolling}
                    >
                      Resolver turno
                    </button>
                  )}
                  <button
                    className="action-btn secundario"
                    onClick={() => {
                      terminarCombate();
                      setCombateModalOpen(false);
                    }}
                  >
                    Terminar combate
                  </button>
                </>
              ) : (
                <>
                  <div className="combate-header">Combate</div>
                  <div className="combate-config">
                    <div className="combate-field">
                      <span className="combate-field-label">Enemigos</span>
                      <span className="stepper">
                        <button
                          onClick={() =>
                            setNuevoCombate((p) => ({
                              ...p,
                              enemigos: Math.max(1, p.enemigos - 1),
                            }))
                          }
                          disabled={nuevoCombate.enemigos <= 1}
                        >
                          -
                        </button>
                        <span>{nuevoCombate.enemigos}</span>
                        <button
                          onClick={() =>
                            setNuevoCombate((p) => ({
                              ...p,
                              enemigos: Math.min(6, p.enemigos + 1),
                            }))
                          }
                        >
                          +
                        </button>
                      </span>
                    </div>
                  </div>
                  <div className="combate-escalado">
                    Sala {salas} · {descripcionEscalado(salas)}
                  </div>
                  {modoTodo && (
                    <button
                      className="action-btn"
                      onClick={() => iniciarCombate(nuevoCombate.enemigos)}
                    >
                      Empezar combate
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {pergaminoOpen && (
        <div className="modal-backdrop" onClick={cerrarPergamino}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Pergamino de Mejora</h2>
              <button
                className="modal-close"
                onClick={cerrarPergamino}
                aria-label="Cerrar"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p className="pergamino-intro">Elige qué quieres mejorar:</p>
              <div className="pergamino-grid">
                <button
                  className="pergamino-btn"
                  onClick={() => aplicarPergamino("hp")}
                >
                  <span className="pergamino-icono">❤️</span>
                  <span className="pergamino-nombre">+2 HP Máx</span>
                </button>
                <button
                  className="pergamino-btn"
                  onClick={() => aplicarPergamino("fuerza")}
                >
                  <span className="pergamino-icono">⚔️</span>
                  <span className="pergamino-nombre">+1 Fuerza</span>
                </button>
                <button
                  className="pergamino-btn"
                  onClick={() => aplicarPergamino("escudo")}
                >
                  <span className="pergamino-icono">🛡️</span>
                  <span className="pergamino-nombre">+1 Escudo Máx</span>
                </button>
                <button
                  className="pergamino-btn"
                  onClick={() => aplicarPergamino("mochila")}
                >
                  <span className="pergamino-icono">🎒</span>
                  <span className="pergamino-nombre">+1 Espacio en Mochila</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`backdrop ${pickerOpen ? "active" : ""}`}
        onClick={cerrarPicker}
      />
      <div className={`item-picker ${pickerOpen ? "active" : ""}`}>
        {Object.entries(ITEMS).map(([tipo, icono]) => (
          <button
            className="item-btn"
            key={tipo}
            onClick={() => seleccionarItem(tipo)}
          >
            {icono} {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

export default App;
