# Experimentos con IA en programación

# Problemas de Programación — JavaScript

## Problema 1 — Contador de vocales

Escribe una función que reciba un string y devuelva cuántas vocales tiene. Por ejemplo, si le pasas `"hola mundo"` debe devolver `3`.

Piensa antes de escribir código: ¿cómo recorrerías cada letra? ¿Cómo sabrías si una letra es vocal?

### Solución propia

```js
const palabra = "letras";

for (let i = 0; i < palabra.length; i++) {
  console.log(palabras[i]);
  const params = ["a", "e", "i", "o", "u"].includes(palabra[i])
  for (let nums = 0; i < params.length; nums++) {
    console.log("hay esta cantidad de vocales: " + nums);
  };
};
```

### Solución IA

```js
const palabra = "hola";
let contadorVocales = 0; // Empieza en 0 antes del bucle

for (let i = 0; i < palabra.length; i++) {
  const esVocal = ["a", "e", "i", "o", "u"].includes(palabra[i]);
  // includes() devuelve true o false — no un array ni un número

  if (esVocal) {
    contadorVocales++; // Solo suma 1 cuando la letra ES vocal
  }
}

// El console.log va fuera del bucle para mostrar el total final
console.log("Hay esta cantidad de vocales: " + contadorVocales);
```

---

## Problema 2 — Agrupar tareas por estado

Tienes este array de tareas:

```js
const tareas = [
  { id: 1, titulo: "Diseñar UI",       completada: true  },
  { id: 2, titulo: "Conectar API",     completada: false },
  { id: 3, titulo: "Escribir tests",   completada: false },
  { id: 4, titulo: "Deploy",           completada: true  }
];
```

Escribe una función que devuelva un objeto con dos propiedades — `completadas` y `pendientes` — cada una con su array correspondiente.

Piensa: ¿qué método de arrays usarías para separar elementos según una condición?

### Solución propia

```js
// Objeto resultado con dos arrays vacíos que se irán llenando
const resultado = {
  completadas: [],
  pendientes: []
};

for (let i = 0; i < tareas.length; i++) {
  const tarea = tareas[i]; // La tarea actual en esta vuelta

  if (tarea.completada === true) {
    // Si está completada, la metemos en el array de completadas
    resultado.completadas.push(tarea);
  } else {
    // Si no, va al array de pendientes
    resultado.pendientes.push(tarea);
  }
}

console.log(resultado);
```

### Solución IA — versión moderna con `filter()`

```js
// filter() recorre el array y devuelve solo los elementos
// que cumplen la condición — hace exactamente lo mismo que
// el bucle for de arriba pero de forma más compacta
const resultado = {
  completadas: tareas.filter(tarea => tarea.completada === true),
  pendientes:  tareas.filter(tarea => tarea.completada === false)
};
```

---

## Problema 3 — Buscar duplicados

Escribe una función que reciba un array de números y devuelva un nuevo array solo con los números que aparecen más de una vez. Por ejemplo, `[1, 2, 3, 2, 4, 3, 5]` debe devolver `[2, 3]`.

Este es el más interesante de los tres porque hay varias formas de resolverlo con distinta eficiencia. Piensa: ¿cómo llevarías la cuenta de cuántas veces aparece cada número?

### Solución propia

```js
const nums = [1, 2, 4, 5, 2, 6, 7, 1, 1, 3, 4, 9, 10];

// Un objeto vacío que usaremos como registro de apariciones
// Al final tendrá algo como: { 1: 3, 2: 2, 4: 2, 5: 1, ... }
const conteo = {};

// Primera pasada: contamos cuántas veces aparece cada número
for (let i = 0; i < nums.length; i++) {
  const num = nums[i];

  if (conteo[num]) {
    // Si el número ya existe en el objeto, sumamos 1 a su cuenta
    conteo[num]++;
  } else {
    // Si es la primera vez que lo vemos, lo inicializamos a 1
    conteo[num] = 1;
  }
}

// Segunda pasada: filtramos los que aparecen más de una vez
const resultNums = [];

for (const num in conteo) {
  if (conteo[num] > 1) {
    // Number() convierte la clave de string a número
    // porque las claves de un objeto son siempre strings
    resultNums.push(Number(num));
  }
}

console.log(resultNums); // [1, 2, 4]
```

### Solución IA — versión moderna

```js
const conteo = {};

// (conteo[num] || 0) + 1 significa: toma el valor actual
// o 0 si todavía no existe, y súmale 1 — elimina el if/else
nums.forEach(num => conteo[num] = (conteo[num] || 0) + 1);

const resultNums = Object.keys(conteo)
  .filter(num => conteo[num] > 1) // Solo los que aparecen más de una vez
  .map(Number);                    // Convierte las claves de string a número

console.log(resultNums); // [1, 2, 4]
```