# Prompt Engineering — Guía de Prompts para Desarrollo

> Colección de prompts probados y documentados para sacar el máximo partido a los asistentes de IA durante el desarrollo de software.

---

## ¿Por qué funcionan bien estos prompts?

Antes de ver los prompts, es importante entender qué hace que un prompt sea efectivo. Un buen prompt tiene tres características clave:

**Rol claro** — Le dice a la IA quién debe ser. No es lo mismo pedirle que "responda" a pedirle que actúe como un "tutor" o un "arquitecto senior". El rol activa un patrón de comportamiento específico.

**Restricciones explícitas** — Le dice qué NO hacer. Esto es igual de importante que decirle qué hacer. "No me des la solución directa" cambia completamente la naturaleza de la respuesta.

**Formato de salida definido** — Le dice cómo estructurar la respuesta. Sin esto, la IA elige el formato por ti, y puede no ser el que necesitas para aprender o trabajar mejor.

---

## Prompt 1 — Tutor de Programación

**Cuándo usarlo:** Cuando estás aprendiendo algo nuevo, tienes un bug que no entiendes, o quieres que te guíen hacia la solución en lugar de dártela directamente. Es especialmente útil en prácticas de empresa donde el objetivo es aprender, no solo entregar.

**Por qué funciona:** Combina el rol de tutor con restricciones de no dar la solución, lo que fuerza a la IA a hacer preguntas socráticamente. El formato de 5 puntos garantiza que siempre recibas contexto técnico antes del código.

```
Quiero que actúes como un tutor o profesor de programación.

Estoy haciendo una práctica y mi objetivo NO es que me resuelvas 
el ejercicio directamente ni copiar código. Quiero entenderlo realmente.

Reglas para ayudarme:
1. No me des la solución completa de inmediato.
2. Primero ayúdame a entender el problema o requerimiento.
3. Explícame el contexto técnico necesario para resolverlo.
4. Si hace falta, divide el problema en pasos pequeños.
5. Hazme preguntas para que yo mismo piense la solución.
6. Si te pido código, dame solo fragmentos pequeños y explícalos línea por línea.
7. Señala posibles errores o trampas comunes.
8. Si ves que estoy bloqueado, guíame con pistas progresivas.
9. Quiero entender el "por qué" de cada cosa, no solo el "cómo".
10. Cuando terminemos un paso, pregúntame si lo entendí antes de avanzar.

Formato de respuesta que prefiero:
1. Explicación conceptual
2. Qué está pasando técnicamente
3. Cómo pensarlo paso a paso
4. Preguntas para que yo razone
5. Ejemplo pequeño explicado

Aquí está el ejercicio o problema:
[PEGAR AQUÍ EL EJERCICIO O TU CÓDIGO]
```

**Ejemplo de uso real:**
```
Estoy haciendo un carrito de compra en JavaScript.

Problema: Cuando elimino un producto se elimina el de arriba 
y no el que selecciono.

Este es mi código: [pegas código]

Quiero entender por qué pasa esto.
No quiero que me des la solución directa.
Guíame para encontrar el error.
Antes de responder, explícame cómo pensaría este problema 
un programador senior.
```

---

## Prompt 2 — Arquitecto de Software Senior

**Cuándo usarlo:** Cuando ya tienes código funcionando pero quieres saber si está bien estructurado. También cuando estás empezando un proyecto y quieres definir la arquitectura antes de escribir una línea de código.

**Por qué funciona:** El rol de "arquitecto senior" activa respuestas orientadas a patrones, principios SOLID y separación de responsabilidades. La clave está en pedir explícitamente el "por qué" de cada decisión — sin esto, la IA tiende a dar soluciones sin explicar el razonamiento detrás.

```
Quiero que actúes como un arquitecto de software senior y mentor técnico.

Mi objetivo no es solo que el código funcione, sino aprender a 
estructurarlo correctamente usando buenas prácticas y arquitectura 
profesional.

Cuando te muestre código, un ejercicio o un proyecto, sigue este proceso:
1. Analiza el problema o código que te envío.
2. Explícame qué arquitectura sería adecuada (MVC, Clean Architecture, capas, etc.).
3. Explícame por qué esa arquitectura es buena para este caso.
4. Señala problemas de diseño o malas prácticas si las hay.
5. Propón cómo debería estructurarse el proyecto (carpetas, responsabilidades, separación de capas).
6. Explica los principios de ingeniería aplicables (SOLID, separación de responsabilidades, etc.).
7. Si muestras código, que sea solo ejemplos pequeños explicados línea por línea.
8. Hazme preguntas para que yo mismo razone las decisiones de arquitectura.
9. Si el diseño se puede mejorar, muéstrame cómo lo haría un desarrollador senior.
10. Ayúdame a entender el "por qué" detrás de cada decisión.

Formato de respuesta:
1. Análisis del problema
2. Arquitectura recomendada
3. Buenas prácticas aplicables
4. Posibles errores o malas prácticas
5. Cómo lo diseñaría un desarrollador senior
6. Preguntas para que yo reflexione

Contexto del ejercicio/proyecto:
[PEGAR AQUÍ EL CÓDIGO, REQUERIMIENTO O PROYECTO]
```

---

## Prompt 3 — Requerimiento Rápido

**Cuándo usarlo:** Cuando tienes un requerimiento concreto y pequeño, sabes lo que quieres pero no tienes claro qué contexto darle a la IA para que te ayude de forma eficiente. Este prompt invierte el flujo — en lugar de tú darle contexto, le preguntas qué necesita.

**Por qué funciona:** Evita el error más común al usar IA para código: dar contexto incompleto y recibir soluciones genéricas. Al preguntar "qué necesitas", la IA te dice exactamente qué compartir para que la solución sea precisa.

```
Necesito implementar [describe el requerimiento en una frase].

Ya tengo implementado: [describe brevemente lo que ya funciona].

¿Qué contexto necesitas o qué información necesitas de mi código 
para ayudarme a cumplir este requerimiento?
```

**Ejemplo de uso real:**
```
Necesito hacer un botón que elimine todos los productos del carrito.

Ya tengo implementado el eliminado individual por producto.

¿Qué contexto necesitas o qué información necesitas de mi código 
para ayudarme a cumplir este requerimiento?
```

---

## Prompt 4 — Revisión de Código por Piezas (Back-end)

**Cuándo usarlo:** Cuando implementas una funcionalidad compleja con varias partes interrelacionadas y quieres validar cada pieza por separado antes de integrarlas. Muy útil en back-end con servicios, DTOs, repositorios y mappers.

**Por qué funciona:** Dar el orden lógico de las piezas le permite a la IA entender el flujo completo antes de analizar cada parte. Pedir explícitamente "dime si está bien o mal y refactoriza tú mismo" ahorra ciclos de conversación y genera feedback más directo y accionable.

```
Te voy a dar el orden de las piezas de [nombre del método/funcionalidad].
De acuerdo a eso, dame el código, dime si está bien o mal, 
refactoriza lo que sea necesario tú mismo, y explícame el por qué 
línea por línea.

Orden de las piezas:
Pieza 1: [describe la primera responsabilidad]
Pieza 2: [describe la segunda responsabilidad]
Pieza 3: [describe la tercera responsabilidad]
[...añade las que necesites]

Código actual:
[PEGAR AQUÍ EL CÓDIGO]
```

---

## Prompt 5 — Debug como Senior

**Cuándo usarlo:** Cuando tienes un bug concreto y quieres entender la causa raíz, no solo el fix. La diferencia con buscar en Google es que este prompt te explica el razonamiento diagnóstico completo.

**Por qué funciona:** Pedir que piense "como un senior" activa un patrón de diagnóstico sistemático — el senior no adivina, elimina posibilidades. Pedir "causa raíz" en lugar de "solución" cambia completamente el tipo de respuesta que recibes.

```
Tengo este bug: [describe el comportamiento incorrecto]
Comportamiento esperado: [describe lo que debería pasar]
Comportamiento actual: [describe lo que está pasando]

Este es mi código: [pega el código relevante]

Antes de darme la solución:
1. Explícame cómo diagnosticaría este bug un programador senior.
2. Dime cuál es la causa raíz, no solo el síntoma.
3. Explícame por qué ocurre esto técnicamente.
4. Guíame hacia la solución con pistas progresivas antes de darme el fix.
```

---

## Prompt 6 — Explicación de Código Ajeno

**Cuándo usarlo:** Cuando recibes código de un compañero, de un proyecto heredado, o de una librería y necesitas entenderlo antes de modificarlo. También útil cuando la IA te genera código y quieres asegurarte de entenderlo antes de aceptarlo.

**Por qué funciona:** Pedir la explicación en capas (qué hace, cómo lo hace, por qué así) garantiza que entiendas tanto el propósito como los detalles de implementación. Sin esta estructura, las explicaciones tienden a ser superficiales.

```
Necesito entender este código antes de modificarlo.
Explícamelo en tres capas:

1. QUÉ HACE — en lenguaje simple, sin tecnicismos, una frase.
2. CÓMO LO HACE — explícame el flujo línea por línea.
3. POR QUÉ ASÍ — dime si hay decisiones de diseño importantes 
   y por qué se tomaron de esa forma en lugar de otra.

Al final, dime si hay algo que mejorarías y por qué.

Código:
[PEGAR AQUÍ EL CÓDIGO]
```

---

## Prompt 7 — Generación de Tests

**Cuándo usarlo:** Cuando tienes una función implementada y quieres aprender a testearla correctamente, entendiendo qué casos cubrir y por qué, no solo generar tests automáticamente.

**Por qué funciona:** Pedir que explique "qué casos de prueba son importantes y por qué" antes de generar el código te enseña a pensar en testing de forma sistemática — una habilidad que no se desarrolla solo copiando tests generados.

```
Tengo esta función implementada y quiero aprender a testearla correctamente.

Antes de generar los tests:
1. Dime qué casos de prueba son importantes para esta función y por qué.
2. Explícame qué es el happy path y qué edge cases debo cubrir.
3. Dime si hay casos de error que debo probar.

Luego genera los tests explicando cada uno línea por línea.

Framework de testing que uso: [Jest / Vitest / JUnit / etc.]

Función a testear:
[PEGAR AQUÍ EL CÓDIGO]
```

---

## Consejos para usar estos prompts mejor

**Sé específico con el contexto.** Cuanto más contexto real des (tu código, tu stack, tu estructura de carpetas), más precisa será la respuesta. La IA no adivina — razona sobre lo que le das.

**Usa el prompt de requerimiento rápido primero.** Antes de dar contexto a lo loco, pregunta qué necesita la IA. Así evitas dar información irrelevante y te centras en lo que importa.

**Combina prompts.** Puedes empezar con el prompt de tutor para entender el problema, y luego usar el de arquitecto para estructurar la solución. No son excluyentes.

**Pide siempre el "por qué".** Es la instrucción más poderosa que puedes añadir a cualquier prompt. La diferencia entre un junior y un senior no es cuánto código saben escribir, sino cuánto entienden por qué ese código está bien escrito.

**Guarda los prompts que funcionan.** Cuando un prompt te da una respuesta excepcionalmente buena, guárdalo y reutilízalo. Con el tiempo construyes tu propio toolkit de prompts adaptado a tu forma de trabajar.