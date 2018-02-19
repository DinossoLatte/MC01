'use strict';

var classes = require('./classes.js');

exports.hand = function (args, res, next) {
    /**
    * Comprueba el ganador de la jugada, o en el caso de trampas las detectará
    * 
    *
    * jugadas List Las jugadas de los jugadores
    * returns ApiResponse
    **/
    var jugadores = args.jugadas.value.jugadas;
    // Primero, realizamos una comprobación de que no existan jugadas amañadas
    // Obtenemos todas las cartas de los jugadores
    var cartasTotales = [].concat.apply([], jugadores.map(x => x.cartas));
    var jugadaAmañada = false;
    // Iniciamos la comparación
    for (var i = 0; i < cartasTotales.length; i++) {
        var carta1 = cartasTotales[i];
        // Comparamos desde el índice i hasta j, ya que antes se habrá comparado
        for (var j = i + 1; j < cartasTotales.length; j++) {
            var carta2 = cartasTotales[j];
            // Comparamos
            jugadaAmañada = equals(carta1, carta2);
            // Si se obtiene una coincidencia, salimos del bucle
            if (jugadaAmañada) {
                break;
            }
        }
        if (jugadaAmañada) {
            break;
        }
    }

    var respuesta = "";
    // Mientras la partida no esté amañada
    if (!jugadaAmañada) {
        // Se procede a ver quién gana
        // Primero, obtenemos el valor total de la apuestas y bote:
        var ganancias = args.jugadas.value.bote + jugadores.map(x => x.apuesta).reduce((x, y) => x + y, 0);
        // Evaluamos cada una de las manos de los jugadores
        var jugadasValor = new Array();
        jugadores.forEach(x => jugadasValor.push([x.jugador, evaluaMano(x.cartas)]));
        // Comparamos los valores de sus jugadas:
        jugadasValor.sort(
            // Primero, comprueba que el valor de la puntuación sea mayor
            (x, y) =>{
                // Primero, si la clase de puntuación es inferior
                if(x[1][0] > y[1][0]) {
                    // Retornamos que es menor
                    return -1;
                } else {
                    // Existen 2 posiblidades, o bien es igual o superior.
                    if(x[1][0] == y[1][0]) {
                        // Si son iguales
                        // Comparamos su número de puntuación y el resultado será la comparación
                        return x[1][1] - y[1][1];
                    } else {
                        // En caso contrario, es siempre superior
                        return 1;
                    }
                }
            });
        console.log(JSON.stringify(jugadasValor));
        // Finalmente, vemos si el valor de los 2 primeros es el mismo, entonces debemos decir que han empatado
        if (jugadasValor[0][1] == jugadasValor[1][1]) {
            respuesta = "Partida empatada";
        } else {
            // En caso contrario, emitimos el resultado
            respuesta = jugadasValor[0][0] + " gana " + ganancias;
        }
    }
    // Si está amañada, retornamos la información, en caso contrario, hemos definido respuesta.
    res.end(jugadaAmañada ? "Partida amañada" : respuesta);
}

/** Comprueba si dos cartas son iguales */
function equals(carta1, carta2) {
    // Primero, se realiza una comprobación del número o letra
    if (carta1.valor == carta2.valor) {
        // Si es el caso, debemos comparar el palo también
        return carta1.palo == carta2.palo;
    }

    return false;
}

function calculaPuntuacion(numeroCartasIgualesConsecutivas, numeroCartasSecuenciales, numeroCartasColor, puntuacion) {
    // Si el color es igual en todas las cartas
    if (numeroCartasColor[0] == 5) {
        // Comprobamos que no tenga una puntuación superior
        if (puntuacion[0] < 4) {
            // Asignamos la puntuación
            // El valor no viene especificado en el documento, por lo tanto será siempre 0.
            puntuacion = [5, 0];
        }
    }
    // Si tenemos una cadena secuencial, comprobamos que el número de cartas sea 5 (única posiblidad de puntuación)
    if (numeroCartasSecuenciales[0] == 5) {
        // Comprobamos que se trate de una escalera de color
        if (numeroCartasSecuenciales[2] != "no") {
            // Si es el caso, es la mayor puntuación y se reemplaza directamente, 8 es su identificativo
            puntuacion = [8, numeroCartasSecuenciales[1]];
        } else {
            // Estamos ante una escalera normal, que al necesitar 5 cartas, reemplazamos directamente porque no puede existir otra combinación
            puntuacion = [5, numeroCartasSecuenciales[1]];
        }
        // Comprobamos si existen parejas, trios, dobles parejas, full o poker
    } else if (numeroCartasIgualesConsecutivas[0] > 1) {
        // Ahora comprobaremos cada uno de los casos:
        if (numeroCartasIgualesConsecutivas[0] == 2) {
            // Se trata de una pareja, comprobamos si existe un trio, ya que puede aplicarse un full
            if (puntuacion[0] == 3) {
                // Asignamos el full
                puntuacion = [6, puntuacion[1]];
                // En otro caso, puede tratarse de una doble pareja
            } else if (puntuacion[0] == 1) {
                // Asignamos doble pareja, conteniendo el valor más alto de ambas parejas
                puntuacion = [2, numeroCartasIgualesConsecutivas[1] > puntuacion[1] ? numeroCartasIgualesConsecutivas[1] : puntuacion[1]];
                // Finalmente, se trata de una simple pareja, asignamos el valor en el caso de no existir mejor puntuacion
            } else if (puntuacion[0] == 0) {
                puntuacion = [1, numeroCartasIgualesConsecutivas[1]];
            }
        }
        if (numeroCartasIgualesConsecutivas[0] == 3) {
            // Tenemos un trio, comprobamos primero si hay pareja (tratandose entonces con un full)
            if (puntuacion[0] == 1) {
                // Asignamos el valor del full
                puntuacion = [6, numeroCartasIgualesConsecutivas[1]];
                // En el caso de tener una puntuacion peor que un trio, le asignamos el trio
            } else if (puntuacion[0] < 2) {
                puntuacion = [3, numeroCartasIgualesConsecutivas[1]];
            }
        }
        if (numeroCartasIgualesConsecutivas[0] == 4) {
            // Tenemos un poker, misma comprobación que los otros repetidos
            if (puntuacion[0] < 7) {
                puntuacion = [7, numeroCartasIgualesConsecutivas[0]]
            }
        }
    }

    // Al terminar la asignación de la puntuación, reseteamos el valor de las puntuaciones temporales:
    numeroCartasIgualesConsecutivas = [0, undefined];
    numeroCartasSecuenciales = [0, undefined, ""];
    numeroCartasColor = [0, undefined];

    return puntuacion;
}

function evaluaMano(cartasSinClase) {
    // Primero, organizamos las cartas por valor y las transformamos a una clase para gestionarlas mejor
    // También organizaremos las cartas de menor a mayor
    var cartas = cartasSinClase.map(x => new classes.Carta(x.valor, x.palo)).sort((x, y) => x.valor > y.valor).reverse();

    // La puntuación por defecto será el valor más alto
    var puntuacion = [0, cartas[0].valor];

    // Esta variable tendrá en primer lugar el número y el otro valor será el valor de la carta repetida
    var numeroCartasIgualesConsecutivas = [0, undefined];
    var numeroCartasSecuenciales = [0, undefined, ""];
    var numeroCartasColor = [0, undefined];

    // Este bucle se encargará de decidir si tiene una puntuación o no
    for (var i = 0; i < cartas.length - 1; i++) {
        var cartaActual = cartas[i];
        var cartaSiguiente = cartas[i + 1];

        // Comprobamos que el color de las cartas es el mismo, para comprobar si es Color
        if (cartaActual.palo == cartaSiguiente.palo) {
            // Ahora comprobamos si existe una cadena de cartas con el mismo color.
            if (cartaActual.palo == numeroCartasColor[1]) {
                // Si es el caso, incrementamos el número de cartas con color.
                numeroCartasColor = [numeroCartasColor[0]++, numeroCartasColor[1]];
            } else {
                // Si es este caso, empezamos de cero o se ha roto la cadena.
                numeroCartasColor = [2, cartaActual.palo];
            }
        }
        // Comprobamos si la carta tiene el mismo valor y, en el caso de estar definida, el valor coincide con las cartas iguales
        if (cartaActual.valor == cartaSiguiente.valor
            && (numeroCartasIgualesConsecutivas[0] == 0 ? true : cartaActual.valor == numeroCartasIgualesConsecutivas[1])) {
                numeroCartasIgualesConsecutivas = [
                    // Incrementamos en 2 si es 0 (tendremos 2 cartas consecutivas) o 1 si es mayor a 1
                    numeroCartasIgualesConsecutivas[0] + (numeroCartasIgualesConsecutivas[0] > 0 ? 1 : 2),
                    // Como el valor debe ser el mismo, le asignamos el que conocemos
                    cartaActual.valor
                ];
        // Otro caso es cuando las cartas estén de forma secuencial (formando una escalera)
        // Si la siguiente es secuencial
        } else if (cartaActual.valor - 1 == cartaSiguiente.valor
            // Y la actual más el número de cartas de la escalera coincide con la carta inicial
            && (numeroCartasSecuenciales[0] == 0 ? true : cartaSiguiente.valor + numeroCartasSecuenciales[0] == numeroCartasSecuenciales[1])) {

            // Guardamos si el palo es el mismo entre la actual y la siguiente
            var mismoPaloSiguiente = cartaActual.palo == cartaSiguiente.palo;
            // Y también para la anterior y la actual
            var mismoPaloAnterior = cartaActual.palo == numeroCartasSecuenciales[2];

            numeroCartasSecuenciales = [
                // Misma explicación que el anterior if
                numeroCartasSecuenciales[0] + (numeroCartasSecuenciales[0] > 0 ? 1 : 2),
                // Si se inicia la escalera, se asigna el valor de la carta actual (más alto), en otro caso, se asigna el anterior
                numeroCartasSecuenciales[1] == undefined ? cartaActual.valor : numeroCartasSecuenciales[1],
                // En esta sección se fija el palo de la escalera o "no" si no tiene el mismo palo
                numeroCartasSecuenciales[2] == "" ?
                    // Si entra en esta sección, se está iniciando la escalera, comprobamos si la primera y segunda carta tienen el mismo palo
                    mismoPaloSiguiente ? cartaActual.palo : "no" :
                    // En otro caso, se está usando una escalera. Comprobamos si la actual coincide y la siguiente también
                    mismoPaloAnterior && mismoPaloSiguiente ? cartaActual.palo : "no"
            ];
        } else {
            // Al romperse la cadena de cartas iguales o secuenciales, debemos guardar la puntuación (sólo si el valor a reemplazar es superior al existente)
            puntuacion = calculaPuntuacion(numeroCartasIgualesConsecutivas, numeroCartasSecuenciales, numeroCartasColor, puntuacion);

            // Restauramos el valor de los contadores de puntuacion temporales:
            numeroCartasIgualesConsecutivas = [0, undefined];
            numeroCartasSecuenciales = [0, undefined, ""];
        }
    }

    // Al terminar el bucle, debemos actualizar la puntuación
    puntuacion = calculaPuntuacion(numeroCartasIgualesConsecutivas, numeroCartasSecuenciales, numeroCartasColor, puntuacion);

    return puntuacion;
}