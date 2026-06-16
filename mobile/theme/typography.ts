// Tipografia oficial da Bateria Mauá (Clube da Manga).
// O manual define a Libre Franklin como fonte de textos (regular) e subtítulos
// (bold/caixa alta). Os títulos no manual usam "Greenth grunge" sempre em minúsculas;
// como essa é uma fonte de marca proprietária, usamos a Libre Franklin Black com a
// regra de caixa baixa via helper `tituloMarca` até que o arquivo da fonte seja embarcado.

import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import {
  LibreFranklin_400Regular,
  LibreFranklin_500Medium,
  LibreFranklin_600SemiBold,
  LibreFranklin_700Bold,
  LibreFranklin_800ExtraBold,
  LibreFranklin_900Black,
} from '@expo-google-fonts/libre-franklin';

export const fonts = {
  regular: 'LibreFranklin_400Regular',
  medium: 'LibreFranklin_500Medium',
  semibold: 'LibreFranklin_600SemiBold',
  bold: 'LibreFranklin_700Bold',
  extrabold: 'LibreFranklin_800ExtraBold',
  black: 'LibreFranklin_900Black',
} as const;

// Mapa consumido pelo `useFonts` no layout raiz.
export const brandFontMap = {
  LibreFranklin_400Regular,
  LibreFranklin_500Medium,
  LibreFranklin_600SemiBold,
  LibreFranklin_700Bold,
  LibreFranklin_800ExtraBold,
  LibreFranklin_900Black,
};

function familyForWeight(weight?: TextStyle['fontWeight']): string {
  switch (weight) {
    case '500':
      return fonts.medium;
    case '600':
      return fonts.semibold;
    case '700':
    case 'bold':
      return fonts.bold;
    case '800':
      return fonts.extrabold;
    case '900':
      return fonts.black;
    default:
      return fonts.regular;
  }
}

// Aplica a Libre Franklin como fonte padrão de todo o app, escolhendo o arquivo
// correto conforme o `fontWeight`. Respeita textos que já definem `fontFamily`
// (ex.: ícones de @expo/vector-icons) para não quebrar a iconografia.
let aplicado = false;
export function applyBrandTypography() {
  if (aplicado) return;
  aplicado = true;

  const TextAny = Text as any;
  const renderOriginal = TextAny.render;
  if (typeof renderOriginal !== 'function') return;

  TextAny.render = function (...args: any[]) {
    const elemento = renderOriginal.apply(this, args);
    const estilo = StyleSheet.flatten(elemento?.props?.style) || {};

    // Não sobrescreve fontes explícitas (ícones, fontes especiais).
    if (estilo.fontFamily) return elemento;

    const fontFamily = familyForWeight(estilo.fontWeight);

    return React.cloneElement(elemento, {
      style: [{ fontFamily }, elemento.props.style, { fontWeight: undefined }],
    });
  };
}

// Regra de marca: títulos sempre em caixa baixa (estilo "Greenth grunge").
export function tituloMarca(texto?: string | null): string {
  return (texto ?? '').toLocaleLowerCase('pt-BR');
}
