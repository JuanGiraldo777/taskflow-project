/**
 * @file server_backend/scripts/syncOriginalDescriptions.js
 * @description updateDescriptions.js mapea descripciones a mano por ID de
 * producto LOCAL — pero producción tiene IDs distintos (reimportación
 * completa el 2026-09-03/04, autoincrement arrancó de otro punto). Este
 * script hace el mismo trabajo pero empareja por NOMBRE de producto (idéntico
 * en ambas bases, viene del mismo Excel de origen), no por ID: lee local
 * para armar nombre->descripción, y aplica esa descripción a la producción
 * real cuyo nombre coincida.
 *
 * DRY-RUN por defecto. Para escribir de verdad: node scripts/syncOriginalDescriptions.js --commit
 * Requiere .env.local Y .env.production presentes (se conecta a las dos).
 */
const mysql = require("mysql2/promise");
const path = require("path");
const dotenv = require("dotenv");

const COMMIT = process.argv.includes("--commit");

const DESCRIPTIONS = {
  24: "El aroma que se volvió costumbre en las noches de sábado. 9 PM abre dulce y jugoso, con un golpe de manzana y canela que se asienta rápido sobre una base cálida de vainilla y maderas oscuras. No busca pasar desapercibido: se queda en la ropa, en el ambiente, en quien lo lleva puesto.",
  23: "La versión concentrada del clásico de Afnan, pensada para quien quiere que la fragancia dure toda la fiesta sin retocar. Mismo carácter dulce-especiado de manzana y canela, pero con más cuerpo y una estela que se nota desde el primer abrazo.",
  44: "Corvus toma su nombre del cuervo, y no es casualidad: es un perfume oscuro, denso, de esos que se sienten antes de verse. Ahli lo construyó para quien prefiere entrar en silencio y dejar huella igual.",
  45: 'Karpos —"fruto" en griego— es la cara más luminosa del catálogo de Ahli: fresco, jugoso, con esa energía de fruta recién cortada que no se toma en serio pero que enamora al primer contacto.',
  46: "Dubai Night lleva el nombre de una ciudad que no duerme, y el perfume tampoco baja el ritmo: ámbar profundo y oud especiado en una combinación intensa, pensada para las horas en las que todo se vuelve más dramático.",
  47: "La edición Gold de Amber Oud es puro lujo árabe clásico: resina, madera y un fondo dorado que envuelve sin apagarse. De las fragancias que se reconocen por su nombre solo con olerlas de lejos.",
  48: "«Cuna de Oro» — así se traduce Mahd Al Dahab, y el perfume está a la altura del nombre: resinas doradas, especias cálidas y un fondo que se siente como un lujo heredado, no comprado.",
  49: "Uhud lleva el nombre de una montaña con historia, y su carácter es igual de firme: madera seca, incienso y una presencia que no pide permiso para hacerse notar.",
  4: "Como su nombre promete, abre fresco y jugoso, casi como un postre helado en un día de calor — pero no se queda ahí. Detrás del cítrico hay un fondo suave que lo vuelve mucho más que un capricho de verano.",
  5: "Marasi For Her mezcla flores blancas con un toque amaderado que no es ni demasiado dulce ni demasiado serio — el punto medio perfecto para usar todos los días sin pensarlo dos veces.",
  25: "La contraparte masculina de Marasi: más especiada, más terrosa, con una salida fresca que se calienta con el paso de las horas hasta dejar una estela ambarada muy fácil de reconocer.",
  26: "El que todos piden por su nombre en clave: 'el que huele a Aventus'. Piña jugosa, abedul ahumado y un fondo de almizcle que lo hace innegablemente elegante para el precio que tiene.",
  27: "Milestone es la versión más pulida del Club de Nuit clásico — mismo ADN afrutado-ahumado, pero con más definición y una proyección que se siente más cara de lo que realmente es.",
  7: "Island Bliss es vacaciones embotelladas: fruta tropical, coco y flores blancas en una mezcla que huele a protector solar de lujo y tardes sin reloj.",
  6: "Bon Bon no finge ser otra cosa: es dulce, es goloso, es ese capricho de caramelo y vainilla que se lleva puesto como quien se pone un vestido favorito.",
  50: "Candee abre con un estallido de fruta y algodón de azúcar — un perfume que huele exactamente a lo que promete su nombre, sin vueltas.",
  51: "Mandarin Sky combina cítricos brillantes con un fondo suave que lo hace perfecto para cualquier momento del día, sin pesar ni cansar.",
  52: "Marshmallow es cremoso y reconfortante, casi gourmand, de esos aromas que abrazan más que perfuman.",
  53: "Montaigne toma el nombre de una de las calles más elegantes de París y se comporta acorde: más sobrio, más amaderado, el más 'de vestir' de toda la línea Odyssey.",
  54: "Soda Pop es efervescente de verdad — frutal, casi carbonatado al olfato, pensado para quien quiere algo divertido sin tomarse muy en serio el perfume.",
  28: "King no pide permiso: especiado, amaderado y con una proyección que llena el cuarto antes de que entres tú. Bharara lo diseñó para quien quiere sentirse exactamente como el nombre indica.",
  8: "Niche Femme toma prestado ese lenguaje floral-afrutado de los perfumes de nicho, pero sin el precio de nicho — versátil de día, con suficiente carácter para la noche.",
  29: "Nitro Red es energía pura: especias rojas, un toque afrutado y una base amaderada que no se anda con rodeos. Perfecto para quien vive acelerado.",
  30: "La versión Intensely sube el volumen del Nitro Red original — más concentración, más duración, mismo carácter atrevido pero con la potencia al máximo.",
  31: "Stallion 53 es masculino sin esforzarse: cuero, especias y un fondo amaderado que envejece bien sobre la piel a medida que pasan las horas.",
  32: "Emir huele a lo que su nombre sugiere: autoridad. Oud, especias y resina en un extrait denso, de los que se notan aunque uses solo dos toques.",
  55: "Toxic Desire juega con el contraste — dulce y oscuro al mismo tiempo, una mezcla adictiva que cambia de carácter según la piel de quien lo lleva.",
  56: "Art Universe no se parece a nada más en el catálogo — una mezcla abstracta de dulce, especiado y amaderado que cambia de personalidad según el momento del día. El más difícil de describir, el más fácil de amar.",
  33: "Asad significa 'león' en árabe, y el perfume ruge parecido: chocolate oscuro, café y una base de pachulí que lo vuelve denso, gourmand y con una personalidad que no pasa desapercibida.",
  34: "El Elixir sube la apuesta del Asad original — más dulce, más concentrado, con una estela que se queda horas después de haberte ido del cuarto.",
  57: "Amethyst es la cara más suave de la línea Badee Al Oud: oud pulido con flores y un toque afrutado que lo hace más accesible sin perder ese carácter árabe de fondo.",
  58: "Honor & Glory va directo a lo intenso: oud, azafrán y especias oscuras en una combinación pensada para ocasiones que piden algo memorable.",
  59: "Noble Blush suaviza el oud con un corazón floral rosado — el equilibrio perfecto entre lo árabe tradicional y algo más romántico.",
  60: "Oud For Glory no se anda con rodeos: es la versión más cruda y resinosa de toda la colección, para quien busca el oud en su forma más honesta.",
  61: "Sublime cierra la línea con una mezcla dulce-amaderada muy pulida — el más 'para todos los días' de los cinco Badee Al Oud, sin perder identidad.",
  9: "Eclaire abre con un golpe de frutas rojas y se asienta sobre una base cremosa y ligeramente especiada — dulce sin empalagar, el tipo de perfume que se convierte en firma personal.",
  35: "Emeer significa 'príncipe', y el perfume se comporta como tal: especiado, amaderado, con una elegancia clásica que no necesita levantar la voz para hacerse notar.",
  10: "Vainilla de verdad, no la versión aguada que se encuentra en cualquier lado — cálida, envolvente, con un fondo ligeramente amaderado que evita que se vuelva empalagosa.",
  36: "El que todo el mundo reconoce por su nombre en código: piña, abedul y un fondo amaderado-almizclado que se ha ganado fama propia por lo cerca que se acerca a fragancias que cuestan diez veces más.",
  11: "La versión femenina de Fakhar cambia la piña por flores blancas y frutas suaves, manteniendo esa misma sensación de lujo accesible que hizo famosa a la línea.",
  12: "Haya significa pudor, y el perfume juega justo con esa idea: flores delicadas, un toque de fruta y una base suave que nunca grita, solo susurra.",
  13: "Her Confession es floral-afrutado con un fondo de almizcle blanco — íntimo, personal, de los que parecen contar un secreto en vez de anunciar una entrada.",
  37: "La contraparte masculina: más especiada, más amaderada, pero con esa misma sensación de algo dicho en confianza, no gritado.",
  62: "El más buscado de Lattafa, y con razón: canela, nuez moscada y vainilla especiada en una mezcla cálida que recuerda a postre navideño, pero con carácter serio de fondo.",
  63: "Dukhan significa 'humo', y esta versión de Khamrah le agrega justo eso — una capa ahumada que vuelve el original más oscuro, más denso, más nocturno.",
  64: "Qahwa reemplaza parte de la dulzura del Khamrah original con notas de café tostado — la versión para quien ama la especia pero quiere algo menos dulce.",
  14: "Mayar es fresco y floral con un fondo amaderado sutil — versátil de sobra para no pensarlo antes de salir, cualquier día, cualquier ocasión.",
  38: "Rave Now Black es intenso y especiado, pensado para la noche y para quien no tiene miedo de dejar estela.",
  15: "La versión femenina de Rave Now mantiene la energía nocturna del original, pero con un corazón más frutal y floral — para salir sin pasar desapercibida.",
  16: "Victoria es clásico en el mejor sentido: floral, elegante, sin necesidad de reinventar nada para funcionar en cualquier ocasión.",
  17: "El perfume que puso a Lattafa en el mapa: praliné, vainilla y flores blancas en una fórmula tan golosa y reconocible que ya tiene fans propios, aparte de cualquier comparación.",
  18: "Candy endulza aún más el Yara original — más azúcar, más gourmand, para quien encontró el original demasiado sutil.",
  19: "El Elixir concentra la fórmula original de Yara: mismo carácter dulce-floral, pero con más cuerpo y una duración notablemente más larga.",
  20: "Moi toma la base de Yara y la vuelve más personal e íntima — menos proyección, más calidez, pensado para quien lo usa para sí misma antes que para los demás.",
  21: "Tous suaviza el perfil de Yara con un toque más floral y menos empalagoso — la versión más ligera de toda la familia.",
  22: "Fantasme juega con contrastes — dulce y misterioso a la vez, como su nombre promete. Frutas oscuras y una base ambarada que se queda pegada a la piel.",
  39: "Verde Aura es fresco y verde de verdad, con un fondo amaderado que lo mantiene serio sin volverse pesado — perfecto para el día a día.",
  65: "Summer Vibes es justo lo que dice: cítrico, ligero, con un toque acuático que transporta directo a un día de playa sin salir de casa.",
  66: "Amber Noir es la versión más oscura de la colección — ámbar profundo con especias que lo vuelven casi nocturno, denso, de esos que se sienten antes de olerse.",
  67: "Amber Rouge le agrega un toque frutal-especiado al ámbar clásico, resultando en algo más cálido y ligeramente más dulce que su hermano Noir.",
  68: "Oud Saffron combina dos ingredientes de lujo en uno: oud terroso y azafrán dorado, en una mezcla que se siente genuinamente exclusiva.",
  69: "Royal Amber es el más clásico de los cuatro — ámbar puro, resinoso, sin distracciones. El punto de partida perfecto si nunca has probado la línea.",
  41: "Atlantis lleva el Hawas original hacia territorio acuático — fresco, salino casi, con ese fondo amaderado que hace a la línea Hawas tan reconocible.",
  42: "Exotic es la versión más especiada y cálida de Hawas — frutas tropicales sobre una base amaderada que se siente hecha para climas calurosos.",
  40: "Ice enfría el Hawas clásico con notas mentoladas y cítricas — el más fresco de toda la línea, ideal para el uso diario sin pensarlo.",
  43: "Malibu suma un aire playero al carácter amaderado de Hawas — cítrico, ligero, con esa energía de sol que no se apaga en todo el día.",
  70: "Freeze es directo: frío, mentolado, con un fondo amaderado que lo mantiene sobrio sin volverse aburrido. Fácil de llevar, difícil de olvidar.",
  71: "Momento está pensado para quedarse en la memoria — dulce y especiado, de los que la gente recuerda mucho después de que te fuiste.",
  72: "'Ana Al Awwal' significa 'yo soy el primero', y el perfume no se anda con modestias: intenso, resinoso, hecho para dejar huella desde el primer contacto.",
  73: "Season Drift cambia de carácter según el clima — fresco cuando hace calor, más cálido cuando baja la temperatura. Un camaleón olfativo.",
  74: "Sweet Mango Melody es puro verano en un frasco: mango jugoso, un toque floral y nada de pretensiones. Perfecto para quien quiere oler bien sin complicarse.",
  92: "Cloud fue el perfume que redefinió lo que significa oler 'a nube': coco cremoso, praliné y un fondo de almizcle que se siente literalmente ingrávido. Dulce sin exagerar, adictivo sin proponérselo.",
  93: "Thank U Next mezcla frutas rojas con un corazón floral-almendrado — más juguetón que Cloud, con esa energía optimista que promete el nombre.",
  94: "El clásico veraniego italiano: limón siciliano, manzana verde y un fondo de cedro que huele a costa amalfitana incluso en pleno invierno. Atemporal por una razón.",
  106: "La versión masculina mantiene ese frescor cítrico icónico, pero con un fondo más amaderado y una pizca de romero que lo vuelve más terroso, menos dulce.",
  95: "L'Eau d'Issey escribió el manual del perfume acuático-floral en los 90 y sigue sin envejecer: loto, flores blancas y una frescura limpia que parece agua en estado puro.",
  96: "Fresh Gold suaviza el icónico frasco dorado de Moschino con notas frutales y florales frescas — lujoso pero sin pesar, perfecto para el uso diario.",
  97: "Fresh Pink es la hermana más dulce de Fresh Gold: frutos rojos y un toque almizclado que lo vuelve más juguetón, menos formal.",
  98: "Toy 2 huele a inocencia con un giro: almendra, flores blancas y almizcle en una fórmula limpia que se siente sofisticada sin intentarlo.",
  99: "Bubblegum le pone azúcar al Toy 2 original — literal, casi: notas golosas que recuerdan a chicle de fresa sobre ese mismo fondo almizclado limpio.",
  107: "Toy Boy es la contraparte masculina de la colección Toy — amaderado y especiado, con ese mismo espíritu lúdico pero llevado a un registro más adulto.",
  108: "Toy Boy 2 sube la intensidad amaderada del original con un toque más resinoso — más serio, más noche, sin perder el guiño divertido de la marca.",
  100: "Heiress es glamour de los 2000 hecho perfume: frutas jugosas y flores sobre una base ambarada, nostálgico para quien lo recuerda y nuevo para quien no.",
  101: "Caramel Dream es gourmand puro — caramelo tostado, vainilla y un fondo cálido que se siente como un postre, pero llevable, no empalagoso.",
  102: "Cherry Baby es la cara más frutal y traviesa de la colección: cereza jugosa sobre un fondo dulce que combina perfecto con esa energía pop de la marca.",
  103: "Bright Crystal es fresco y floral con un toque afrutado de granada — el perfume que definió toda una era de frascos icónicos en tocadores.",
  104: "Dylan Blue Pour Femme mezcla frutas acuosas con flor de loto y un fondo de almizcle — más moderno, más versátil que los clásicos Versace florales.",
  109: "Eros Energy toma la fórmula icónica de Eros y la aligera — más cítrico, más fresco, pensado para el día en vez de la noche.",
  110: "Eros Flame sube la temperatura del original con especias y un fondo más ahumado — la versión más intensa y nocturna de toda la línea.",
  111: "El Eros original en su versión EDP: menta, manzana verde y un fondo de vainilla-haba tonka que lo volvió uno de los perfumes masculinos más reconocibles de la década.",
  112: "La versión EDT del mismo Eros — más ligera, más fresca, ideal para quien ama el carácter del original pero prefiere algo menos pesado para el día.",
  105: "Yellow Diamond es cítrico y floral con un brillo casi champán — luminoso, ligero, hecho para las tardes de sol.",
  83: "Black Oud no esconde nada en el nombre: oud oscuro, denso, con un fondo resinoso que lo hace inconfundible entre cualquier otro perfume del catálogo.",
  84: "Genova lleva el nombre de una ciudad portuaria italiana, y el perfume tiene ese carácter marino-elegante — fresco pero con peso, sofisticado sin exagerar.",
  85: "Il Arte se acerca al perfume como quien pinta un cuadro: capas que se revelan de a poco, una mezcla abstracta que no se deja resumir en dos o tres notas. De los que se descubren, no se explican.",
  75: "Il Femme es la interpretación de Ilmin sobre lo femenino — floral, íntimo, con una calidez que se siente personal más que universal.",
  86: "Kakuno tiene ese carácter distintivo de la perfumería nicho coreana: minimalista en apariencia, pero con una profundidad que se revela recién después de un rato sobre la piel.",
  87: "Il Mexico es un homenaje olfativo — cálido, especiado, con esa vibra vibrante y colorida que el nombre promete desde el frasco.",
  88: "Navisi es de los perfumes más enigmáticos de la línea Ilmin: una fórmula que cambia de carácter con el paso de las horas, difícil de anticipar y fácil de querer.",
  89: "El nombre no busca pasar desapercibido, y el perfume tampoco: sensual, denso, pensado para dejar una impresión que se queda mucho después de que te fuiste.",
  90: "Roso —'rojo' en italiano— es la nota más intensa y cálida de la colección Ilmin, con ese carácter profundo que el color evoca incluso antes de oler el frasco.",
  76: "All In no se guarda nada — especiado, amaderado, intenso desde el primer rociado. El nombre lo dice todo: esto es apostarlo todo a una sola fragancia.",
  77: "Black Sapphire es el más oscuro y misterioso de la colección Game of Spades — resinas profundas y un fondo casi mineral, frío y elegante a la vez.",
  78: "Blind Bid juega con lo inesperado: una salida fresca que da paso a un fondo mucho más cálido y especiado del que promete al principio. Una apuesta que vale la pena.",
  79: "Platinum es la versión más pulida y lujosa de toda la línea — suave, amaderado, sin una sola nota fuera de lugar.",
  80: "La concentración Extrait de Rogue no se anda con sutilezas: máxima intensidad, máxima duración, para quien ya conoce la línea y quiere ir directo al fondo.",
  81: "Royale es el más clásico y solemne del set — especias cálidas sobre una base amaderada noble, hecho para ocasiones que piden algo serio.",
  82: "Wildcard es el comodín de la colección: impredecible, con un carácter afrutado-especiado que no se parece del todo a ningún otro Game of Spades.",
  91: "Levante Exclussif se aleja del universo de cartas para ofrecer algo más mediterráneo — cítrico, resinoso, con ese carácter cálido que evoca las costas del este del Mediterráneo.",
};

async function main() {
  // Local: mismas credenciales que .env.local usa por defecto.
  const localEnv = {};
  dotenv.config({ path: path.resolve(__dirname, "../.env.local"), processEnv: localEnv });
  const localPool = mysql.createPool({
    host: localEnv.DB_HOST,
    port: parseInt(localEnv.DB_PORT, 10),
    user: localEnv.DB_USER,
    password: localEnv.DB_PASSWORD || "",
    database: localEnv.DB_NAME,
  });

  // Producción: .env.production, SSL requerido por Aiven.
  const prodEnv = {};
  dotenv.config({ path: path.resolve(__dirname, "../.env.production"), processEnv: prodEnv });
  const prodPool = mysql.createPool({
    host: prodEnv.DB_HOST,
    port: parseInt(prodEnv.DB_PORT, 10),
    user: prodEnv.DB_USER,
    password: prodEnv.DB_PASSWORD,
    database: prodEnv.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  console.log(
    COMMIT
      ? "Modo COMMIT — se va a escribir en producción."
      : "Modo DRY-RUN — no se escribe nada. Corre con --commit para aplicar de verdad.",
  );

  const [localRows] = await localPool.query(
    "SELECT id, name FROM products WHERE type = 'original'",
  );

  const nameToDescription = new Map();
  const localSinMapeo = [];
  for (const row of localRows) {
    const desc = DESCRIPTIONS[row.id];
    if (!desc) {
      localSinMapeo.push(row);
      continue;
    }
    nameToDescription.set(row.name.trim().toLowerCase(), desc);
  }

  if (localSinMapeo.length > 0) {
    console.log(
      `\n(Aviso: ${localSinMapeo.length} producto(s) originales en LOCAL sin descripción en el mapa — se ignoran, no bloquean el resto)`,
    );
  }

  const [prodRows] = await prodPool.query(
    "SELECT id, name, description FROM products WHERE type = 'original'",
  );

  let matched = 0;
  let alreadyOk = 0;
  const unmatched = [];

  for (const row of prodRows) {
    const desc = nameToDescription.get(row.name.trim().toLowerCase());
    if (!desc) {
      unmatched.push(row);
      continue;
    }
    if (row.description === desc) {
      alreadyOk += 1;
      continue;
    }
    matched += 1;
    if (COMMIT) {
      await prodPool.execute("UPDATE products SET description = ? WHERE id = ?", [
        desc,
        row.id,
      ]);
    } else {
      console.log(`  [dry-run] #${row.id} ${row.name} -> "${desc.slice(0, 70)}..."`);
    }
  }

  console.log(
    `\n${COMMIT ? "Actualizados" : "Para actualizar"}: ${matched} | ya estaban bien: ${alreadyOk} | total originales en producción: ${prodRows.length}`,
  );

  if (unmatched.length > 0) {
    console.log(`\nSin coincidencia por nombre (${unmatched.length}) — revisar a mano:`);
    unmatched.forEach((r) => console.log(`  #${r.id} ${r.name}`));
  }

  await localPool.end();
  await prodPool.end();
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exitCode = 1;
});
