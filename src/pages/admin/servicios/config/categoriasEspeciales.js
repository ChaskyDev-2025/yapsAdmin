// Configuración para categorías especiales (sin tocar Viajes y Envíos)

export const CATEGORIAS_ESPECIALES = {
  "carga_local": {
    tipo_calculo: "tarifa_fija",
    servicios: ["vagoneta", "camioneta pequena", "camioneta mediana"],
    campos: {
      tarifa_base: { label: "Tarifa Base (Bs)", type: "number", step: "0.01" },
      unidad_precio: { label: "Unidad de Precio", type: "select", options: ["Bs", "USD"] }
    }
  },
  "carga_nacional": {
    tipo_calculo: "tarifa_fija",
    servicios: ["camioneta mediana", "camion grande", "camion extra grande", "tracto camion"],
    campos: {
      tarifa_base: { label: "Tarifa Base (Bs)", type: "number", step: "0.01" },
      unidad_precio: { label: "Unidad de Precio", type: "select", options: ["Bs", "USD"] }
    }
  },
  "carga_internacional": {
    tipo_calculo: "tarifa_fija",
    servicios: ["camion gran tonelaje", "camion refrigerado", "camion toldo", "tracto camion"],
    campos: {
      tarifa_base: { label: "Tarifa Base (Bs)", type: "number", step: "0.01" },
      unidad_precio: { label: "Unidad de Precio", type: "select", options: ["Bs", "USD"] }
    }
  },
  "construccion": {
    tipo_calculo: "tarifa_fija",
    servicios: ["volqueta 4 cubos", "volqueta 8 cubos", "volqueta 12 cubos", "camion material"],
    campos: {
      tarifa_base: { label: "Tarifa Base (Bs)", type: "number", step: "0.01" },
      unidad_precio: { label: "Unidad de Precio", type: "select", options: ["Bs", "USD"] }
    }
  },
  "mudanza": {
    tipo_calculo: "tarifa_mudanza",
    servicios: ["camioneta pequena", "camioneta mediana", "camion grande"],
    campos: {
      tarifa_base: { label: "Tarifa Base (Bs)", type: "number", step: "0.01" }
    }
  },
  "maquinaria_y_gruas": {
    tipo_calculo: "alquiler_horas",
    servicios: ["motoniveladora", "retro excavadora", "excavadora hidraulica", "gruas pluma", "gruas rampa"],
    campos: {
      costo_por_hora: { label: "Costo por hora (Bs)", type: "number", step: "0.01" },
      costo_traslado: { label: "Costo de traslado (Bs)", type: "number", step: "0.01" },
      horas_minimas: { label: "Horas mínimas", type: "number", step: "0.01" }
    }
  }
};

// Estructura de datos esperada en Firestore para cada tipo
export const ESTRUCTURA_TIPOS_CALCULO = {
  tarifa_fija: {
    tarifa_base: 0,
    unidad_precio: "Bs"
  },
  viaje_material: {
    tarifa_base: 0
  },
  tarifa_mudanza: {
    tarifa_base: 0
  },
  alquiler_horas: {
    tarifa_base: 0
  }
};
