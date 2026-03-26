# Calculadora de Numeros Complejos

Aplicacion web para operaciones con numeros complejos, evaluacion de expresiones y visualizacion en el plano complejo. Incluye modo binomica/polar, historial interactivo, pasos para expresiones combinadas y conversion a fracciones cuando aplica.

## Caracteristicas principales

- Operaciones basicas entre Z1 y Z2: suma, resta, multiplicacion y division.
- Modo binomica (Re/Im) y modo polar (r∠theta) con unidades en rad o deg.
- Expresiones combinadas con parentesis y operadores +, -, *, /.
- Soporte de terminos polares dentro de expresiones (ej: 4∠1.5 - 1∠0.3).
- Historial con recalculo y copiado de entradas.
- Plano complejo con leyenda, cuadricula y reset de vista.
- Resultados con modulo, argumento (rad y deg), polar y conjugado.
- Opcion para mostrar resultados como fracciones.

## Como usar

1) Selecciona el modo de calculo:
   - Simple: usa Z1 y Z2.
   - Combinado: usa una expresion completa.

2) Si estas en modo Simple:
   - Elige Modo Binomica o Polar.
   - En Binomica ingresa Re/Im.
   - En Polar ingresa r∠theta y selecciona unidad (rad/deg).

3) Presiona Calcular para obtener el resultado.

## Expresiones combinadas

- Activa el modo Combinado en "Calculo".
- Escribe la expresion completa en el campo de expresion.
- Se respetan prioridades: * y / antes que + y -.
- Ejemplos:
  - (3+2i)+(1-4i)
  - ((2+i)*(3-i))/(1-2i)
  - (4∠1.5)-(1∠0.3)
  - ((1+2i)-(3-4i))*(2+i)

Si hay un error de sintaxis, se subraya el token invalido y se muestra un tooltip con la posicion.

## Modo polar

- Entrada: r∠theta (tambien admite el simbolo <).
- Unidades: rad o deg, seleccionables.
- En el resultado se muestran:
  - Argumento en rad y deg.
  - Forma polar (r∠theta) segun la unidad activa.

## Historial

- Cada entrada se puede recalcular con un click.
- Boton Copiar para copiar toda la linea.
- Limpiar elimina todas las entradas.

## Plano complejo

- Muestra Z1, Z2 y el resultado.
- Cuadricula ON/OFF.
- Reset recalcula el canvas y reescala la vista.

## Atajos de teclado

- +, -, *, / cambia la operacion (cuando no estas escribiendo en un input).
- Enter ejecuta el calculo.

## Estructura del proyecto

- index.html: pagina principal.
- styles.css: import de CSS.
- css/base.css: variables, layout y tipografia.
- css/components.css: inputs, botones, cards y resultados.
- css/graph.css: estilos de grafica.
- css/history.css: estilos de historial.
- js/complex.js: operaciones de numeros complejos.
- js/format.js: formateo y fracciones.
- js/graph.js: render del plano complejo.
- js/expression.js: parser y evaluacion de expresiones.
- js/store.js: estado global.
- js/app.js: control principal de UI y eventos.

## Problemas comunes

- La expresion marca error: revisa parentesis y operadores; el subrayado indica el token invalido.
- No se puede copiar: algunos navegadores bloquean el portapapeles si no hay interaccion directa.
- Resultado inesperado en polar: verifica si la unidad esta en rad o deg.
- Division por cero: Z2 no puede ser 0 en el modo Simple.
- La grafica no aparece: calcula una operacion primero; el plano se muestra con resultados.
