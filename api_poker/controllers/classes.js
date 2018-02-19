class Carta {
    constructor(valor, palo) {
        // Transformamos el valor en un número, no una mezcla
        // Primero comprobamos si el valor es un número o no
        if(!isNaN(valor)) {
            this.valor = parseInt(valor);
        } else {
            // Dependiendo del valor, seleccionamos uno u otro
            switch(valor) {
                case "J":
                    this.valor = 11;
                    break;
                case "Q":
                    this.valor = 12;
                    break;
                case "K":
                    this.valor = 13;
                    break;
                // Aunque A es 1, debido a la comprobación de valores, es más cómodo asumir su valor como 14.
                case "A":
                    this.valor = 14;
                    break;
            }
        }
        // Asignamos el palo
        this.palo = palo;
    }
}

exports.Carta = Carta;