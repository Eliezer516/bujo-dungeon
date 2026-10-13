import { useState, useRef, useEffect, useCallback } from "react";
import "./App.css";

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
          stop();
          onDone?.();
        }
      }, delay);
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  return { rolling, start, stop };
}

function App() {
  const [modoTodo, setModoTodo] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  const [etiqueta, setEtiqueta] = useState("Tira un dado");
  const [dado, setDado] = useState("-");
  const [resultado, setResultado] = useState("-");
  const [cartasTodo, setCartasTodo] = useState([]);

  const [stats, setStats] = useState({
    hp: 10,
    fuerza: 3,
    escudo: 3,
    mochila: 4,
  });
  const [inventario, setInventario] = useState([null, null, null, null]);
  const [slotSeleccionado, setSlotSeleccionado] = useState(-1);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { rolling, start } = useRolling();

  const ajustarInventario = useCallback((mochila) => {
    setInventario((prev) => {
      if (prev.length < mochila)
        return [...prev, ...Array(mochila - prev.length).fill(null)];
      return prev.slice(0, mochila);
    });
  }, []);

  const updateStat = (stat, delta) => {
    setStats((prev) => {
      const next = { ...prev, [stat]: Math.max(0, prev[stat] + delta) };
      if (stat === "mochila") ajustarInventario(next.mochila);
      return next;
    });
  };

  const tirar = (tabla) => {
    if (rolling) return;
    setCartasTodo([]);
    const finalR = rollD6();
    start(
      () => setDado(rollD6()),
      () => {
        setDado(finalR);
        if (tabla === "batalla") {
          setEtiqueta(ETIQUETAS[tabla]);
          setResultado(finalR >= 4 ? "Acierto" : "Fallo");
        } else {
          setEtiqueta(ETIQUETAS[tabla]);
          setResultado(RESULTADOS[tabla](finalR));
        }
      },
    );
  };

  const tirarTodo = () => {
    if (rolling) return;
    setEtiqueta("Tira un dado");
    setDado("-");
    setResultado("-");

    const resultados = {};
    TABLAS.forEach((t) => (resultados[t] = rollD6()));

    start(
      () => {
        setDado(rollD6());
        setCartasTodo(
          TABLAS.map((t) => {
            const r = rollD6();
            return { tabla: t, num: r, res: RESULTADOS[t](r) };
          }).filter(
            ({ tabla }) => tabla !== "contenido" || resultados["cofre"] > 3,
          ),
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
            res: RESULTADOS[t](resultados[t]),
          })).filter(({ tabla }) => {
            if (tabla !== "contenido") return true;
            return resultados["cofre"] > 3;
          }),
        );
      },
    );
  };

  const manejarSlot = (index) => {
    if (inventario[index]) {
      setInventario((prev) => prev.map((v, i) => (i === index ? null : v)));
    } else {
      setSlotSeleccionado(index);
      setPickerOpen(true);
    }
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

  return (
    <>
      <div className="pantalla">
        <div className="etiqueta">{etiqueta}</div>
        {!modoTodo && (
          <>
            <p className={`dado ${rolling ? "rolling" : ""}`}>{dado}</p>
            <div className="resultado">{resultado}</div>
          </>
        )}
        {modoTodo && (
          <div className="dado-multi">
            {cartasTodo.length > 0
              ? cartasTodo.map(({ tabla, num, res }) => (
                  <div className="dado-card" key={tabla}>
                    <div className="dc-label">{tabla}</div>
                    <div className="dc-num">{num}</div>
                    <div className="dc-res">{res}</div>
                  </div>
                ))
              : TABLAS.map((t) => (
                  <div className="dado-card placeholder" key={t}>
                    <div className="dc-label">{t}</div>
                    <div className="dc-num">-</div>
                    <div className="dc-res"></div>
                  </div>
                ))}
          </div>
        )}
      </div>

      <div className="stats-panel">
        {Object.entries(stats).map(([stat, val]) => (
          <div className="stat-row" key={stat}>
            <span className="stat-label">
              {stat === "hp"
                ? "HP"
                : stat === "fuerza"
                  ? "FUE"
                  : stat === "escudo"
                    ? "ESC"
                    : "MOCH"}
            </span>
            <button
              className="stat-btn minus"
              onClick={() => updateStat(stat, -1)}
              disabled={val <= 0}
            >
              -
            </button>
            <span className="stat-value">{val}</span>
            <button
              className="stat-btn plus"
              onClick={() => updateStat(stat, 1)}
            >
              +
            </button>
          </div>
        ))}
      </div>

      <div className="inventario-panel">
        {inventario.map((item, i) => (
          <div
            className={`slot ${item ? "filled" : "empty"}`}
            key={i}
            onClick={() => manejarSlot(i)}
          >
            {item ? ITEMS[item] : ""}
          </div>
        ))}
      </div>

      <div className="controles">
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
          <button
            className="action-btn todo-btn"
            onClick={tirarTodo}
            disabled={rolling}
          >
            Tirar Todo
          </button>
        )}
      </div>

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
                    if (activado) setCartasTodo([]);
                  }}
                />
                <span className="slider" />
              </label>
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
    </>
  );
}

export default App;
