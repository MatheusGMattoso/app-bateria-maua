/** Espelha NIVEIS em backend/src/services/gamificacaoService.js */
export const NIVEIS_MANGA = [
  { numero: 1, nome: 'Semente', min: 0, icone: '🌱' },
  { numero: 2, nome: 'Broto', min: 8, icone: '🌿' },
  { numero: 3, nome: 'Manga Verde', min: 20, icone: '🥭' },
  { numero: 4, nome: 'Manga Madura', min: 40, icone: '🧡' },
  { numero: 5, nome: 'Ouro Mauá', min: 70, icone: '🏆' },
] as const;

export type NivelManga = (typeof NIVEIS_MANGA)[number];

export function rotuloPontosNivel(nivel: NivelManga, indice: number): string {
  if (indice === 0) return 'Nível inicial (0 pts)';
  return `${nivel.min} pts para desbloquear`;
}

export function faixaPontosNivel(indice: number): string {
  const atual = NIVEIS_MANGA[indice];
  const proximo = NIVEIS_MANGA[indice + 1];
  if (!proximo) return `${atual.min}+ pts`;
  return `${atual.min}–${proximo.min - 1} pts`;
}
