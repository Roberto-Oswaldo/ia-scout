export type Player = {
  id: string;
  name: string;
  age: number;
  position: "Base" | "Escolta" | "Alero" | "Ala-pívot" | "Pívot";
  team: string;
  points: number;
  rebounds: number;
  assists: number;
  efficiency: number;
  speed: number;
  stamina: number;
  injuryHistory: string;
  height: number;
  rating: number;
  rationale: string;
};

export const players: Player[] = [
  { id: "p01", name: "Mateo Ríos", age: 21, position: "Base", team: "Lobos UANL", points: 18.4, rebounds: 3.2, assists: 7.1, efficiency: 91, speed: 88, stamina: 92, injuryHistory: "Sin lesiones recientes", height: 183, rating: 9.4, rationale: "Visión de cancha sobresaliente y gran control del ritmo en finales cerrados." },
  { id: "p02", name: "Santiago Cruz", age: 20, position: "Escolta", team: "Borregos MTY", points: 22.1, rebounds: 4.6, assists: 3.4, efficiency: 94, speed: 86, stamina: 89, injuryHistory: "Esguince de tobillo (2024), recuperado", height: 190, rating: 9.2, rationale: "Anotador eficiente en catch-and-shoot; alto impacto sin monopolizar posesiones." },
  { id: "p03", name: "Diego Navarro", age: 22, position: "Alero", team: "Águilas UPAEP", points: 16.7, rebounds: 7.8, assists: 2.9, efficiency: 88, speed: 83, stamina: 90, injuryHistory: "Sin antecedentes relevantes", height: 198, rating: 8.9, rationale: "Alero versátil con rebote defensivo y capacidad de cambiar en defensa." },
  { id: "p04", name: "Emiliano Torres", age: 19, position: "Ala-pívot", team: "Pumas UNAM", points: 14.2, rebounds: 9.1, assists: 2.1, efficiency: 86, speed: 79, stamina: 87, injuryHistory: "Molestia muscular (2025), alta médica", height: 202, rating: 8.6, rationale: "Proyección física notable; ocupa la pintura y corre bien la transición." },
  { id: "p05", name: "Andrés Vega", age: 23, position: "Pívot", team: "Leones Anáhuac", points: 12.8, rebounds: 11.4, assists: 1.8, efficiency: 90, speed: 72, stamina: 84, injuryHistory: "Sin lesiones recientes", height: 208, rating: 8.5, rationale: "Protección de aro consistente y presencia física para cerrar el rebote." },
  { id: "p06", name: "Nicolás Méndez", age: 20, position: "Base", team: "Borregos Puebla", points: 15.3, rebounds: 3.8, assists: 6.4, efficiency: 87, speed: 91, stamina: 88, injuryHistory: "Sin antecedentes relevantes", height: 180, rating: 8.3, rationale: "Acelera el juego y genera ventajas en penetración contra defensas en zona." },
  { id: "p07", name: "Gael Castillo", age: 21, position: "Alero", team: "Lobos UAC", points: 13.6, rebounds: 6.2, assists: 3.1, efficiency: 82, speed: 85, stamina: 93, injuryHistory: "Hombro (2023), sin recurrencia", height: 196, rating: 7.9, rationale: "Energía sostenida y buen perfil para una rotación defensiva larga." },
  { id: "p08", name: "Bruno Salas", age: 22, position: "Escolta", team: "Halcones UV", points: 17.9, rebounds: 3.9, assists: 2.7, efficiency: 85, speed: 87, stamina: 86, injuryHistory: "Sin lesiones reportadas", height: 188, rating: 7.7, rationale: "Amenaza exterior fiable; suma spacing y tiro libre en media cancha." },
];

export const performanceTrend = [
  { game: "J1", points: 14, rebounds: 6, assists: 5 },
  { game: "J2", points: 19, rebounds: 4, assists: 8 },
  { game: "J3", points: 16, rebounds: 7, assists: 6 },
  { game: "J4", points: 23, rebounds: 5, assists: 9 },
  { game: "J5", points: 18, rebounds: 8, assists: 7 },
  { game: "J6", points: 21, rebounds: 6, assists: 8 },
];