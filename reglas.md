# 🏰 BuJo Dungeon: El Laberinto

Dungeon-crawler táctico y espacial para tu libreta.
**Necesitas:** un d6, lápiz, borrador y cuaderno cuadriculado o punteado.

### 👤 FICHA DEL HÉROE

```text
VIDAS:    [♥️♥️♥️♥️♥️♥️♥️♥️♥️♥️] 10/10
FUERZA: 3  (Daño = 1 + Fuerza - 3)
ESCUDO:   [🛡️️🛡️🛡️] 3/3 usos
MOCHILA: [____] [____] [____] [____]
```

**Kits de Inicio** (Elige uno, no se puede cambiar):

- 🛡️ **Clásico:** Poción · Escudo · Bomba · Vacío _(Equilibrado)_
- ⚔️ **Guerrero:** Escudo · Escudo · Poción · Vacío _(Tanque)_
- 🦶 **Explorador:** Bomba · Bomba · Poción · Vacío _(Evasivo)_
- 🧪 **Alquimista:** Poción · Poción · Escudo · Vacío _(Supervivencia)_

> **Items:**
>
> - **Poción de Curación:** Cura 3 HP. Rápida entre salas; en combate, gasta tu turno.
> - **Reparador de Escudo:** Repara tu escudo equipado a 3/3. Solo usable entre salas o si tu escudo está a 0.
> - **Bomba de Escape:** Huye tras ver enemigos pero antes de combatir. Pierdes 1 HP y el botín de esa sala.
> - **Pergamino de Mejora:** Aumenta permanentemente +2 HP Máx, +1 Fuerza, +1 Escudo Máximo o **+1 Espacio en Mochila**. Úsalo entre salas.

### 🗺️ PREPARACIÓN DEL LABERINTO

1.  Dibuja un rectángulo en tu hoja (ej. 8x6 o 10x10 casillas). Este es tu mapa total.
2.  Marca una casilla en el borde como **"Entrada"**.
3.  El objetivo es llenar todo el rectángulo con salas. La última sala en colocarse será la del Jefe.

**Regla de Oro del Espacio:**
Al colocar una sala, debes asegurarte de no dejar "islas" de casillas vacías rodeadas completamente por salas ya dibujadas. El espacio debe permanecer conectado y accesible hasta el final. Si una tirada de tamaño no cabe o encierra espacio inválido, ajusta la forma lo mejor posible dentro de las reglas de la Tabla S.

### 🕹️ FLUJO DE JUEGO

1.  Entras por la puerta de entrada.
2.  **Tira d6 → Tamaño (Tabla S).** Dibuja la sala conectada a tu posición actual, ocupando casillas libres.
3.  **Tira d6 → Puertas (Tabla P).** Coloca las salidas hacia áreas aún vacías del rectángulo.
4.  **Tira d6 → Enemigos (Tabla E).** Colócalos dentro de la sala.
5.  **Tira d6 → ¿Cofre? (Tabla C).** Si sale 4-6, dibuja un cofre abierto.
6.  **Combate o Huida.** Resuelve la pelea. Si ganas, abre el cofre (si hay).
7.  **Elige puerta.** Avanza a la siguiente sala libre.
8.  Repite desde el paso 2 hasta que **no quede ni una sola casilla libre** en el rectángulo.
9.  La última sala colocada es la **Sala del Jefe**.

### 📊 TABLAS UNIFICADAS

**Generación de Sala**

| Tabla S: Tamaño | Tabla P: Puertas | Tabla E: Enemigos |
| :-------------- | :--------------- | :---------------- |
| **1-2** = 3     | **1-4** = +1     | **1-2** = 1       |
| **3-4** = 4     | **5-6** = +2     | **3-4** = 2       |
| **5** = 5       |                  | **5-6** = 3       |
| **6** = 6       |                  |                   |

_(Nota: Las puertas adicionales se suman a la puerta por la que entraste)._

**Botín y Recompensas**

| Tabla C: ¿Cofre? | Tabla CC: Contenido           |
| :--------------- | :---------------------------- |
| **1-3** = No     | **1** = 💥 Trampa (-1 HP)     |
| **4-6** = Sí     | **2** = Poción de Curación    |
|                  | **3** = Reparador de Escudo   |
|                  | **4** = Bomba de Escape       |
|                  | **5-6** = Pergamino de Mejora |

### ⚔️ COMBATE Y ESCALADO

**Combate (Turnos alternos):**

- **Héroe:** Sacas 4-6 en d6 → Daño = 1 + (Fuerza - 3).
- **Enemigo:** Saca 4-6 en d6 → Daño = 1.
- **Escudo:** Absorbe el primer golpe de la sala automáticamente.

**Escalado de Enemigos (por número de sala recorrida):**

| Salas      | Enemigo                     | Vida  |
| :--------- | :-------------------------- | :---- |
| 1 - 5      | 🐛 Bicho                    | 1     |
| 6 - 15     | d6: 1-3 Bicho / 4-6 Bruto   | 1-2   |
| 16 - 25    | d6: 1-3 Bruto / 4-6 Demonio | 2-3   |
| 26+        | 👹 Demonio                  | 3     |
| **Última** | 🐉 **JEFE FINAL**           | **5** |

### 💡 CONSEJOS ESTRATÉGICOS

- **Piensa en Tetris, no en suerte:** Si te sale una sala grande (6 casillas) al principio, pégala a una esquina o borde. Deja el centro y los espacios irregulares para cuando tengas más opciones de formas (L, T, cruces). Fragmentar el mapa temprano es sentencia de muerte.
- **El cofre visible es una trampa mental:** Recuerda que el cofre se ve _antes_ de combatir, pero solo se abre _después_. Si usas la Bomba de Escape para huir, pierdes ese botín para siempre. En un mapa finito donde cada recurso cuenta, a veces vale la pena arriesgar 1 HP extra antes que perder una Poción de Curación potencial.
- **Gestiona tu ruta al Jefe:** No llenes el mapa de forma aleatoria. Intenta mantener siempre una "autopista" de casillas libres conectadas hacia la zona más profunda del rectángulo. Si cierras el paso antes de tiempo, podrías quedarte sin espacio válido para la sala final.
- **La mochila llena es un lujo:** En este modo no hay tiendas ni descartes gratuitos fuera de combate. Si tu mochila está llena y sale un Reparador de Escudo en un cofre, tendrás que consumir o descartar algo _en ese momento_. Planifica qué item sacrificar antes de abrir.
- **El Escudo equipado vs. el Item:** No confundas tu defensa activa `[️🛡️🛡️]` con el item "Reparador de Escudo" de la mochila. El item repara; no bloquea. Si entras a una sala difícil con el escudo activo dañado, considera repararlo _antes_ de entrar si tienes el item, porque el escudo absorbe el primer golpe automáticamente y eso puede salvarte la vida contra un grupo de 3 enemigos.
- **Usa el Pergamino con cabeza:** El Pergamino de Mejora es el tesoro más valioso. No lo uses impulsivamente. Guardarlo para después de una sala difícil puede ser la diferencia entre llegar al jefe con 2 HP o con 10. Si sientes que te falta espacio para llevar más pociones o bombas, aumentar la mochila es tan vital como subir tus estadísticas de combate.
