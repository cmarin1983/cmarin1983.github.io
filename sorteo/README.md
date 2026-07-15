# 🎲 Sorteador - marins.dev

Sorteos transparentes y aleatorios para eventos en vivo.

## Características

- **Hasta 200 números** — configurables (50, 100, 200).
- **Asignación de participantes** — clic en un número para asignar nombre.
- **Editar / eliminar** — modificar o liberar números fácilmente.
- **Persistencia local** — los datos se guardan automáticamente en el navegador (localStorage).
- **Contador de participantes** — muestra cuántos han sido registrados y cuántos números libres quedan.
- **Sorteo múltiple** — de 1 a 10 ganadores seleccionables.
- **Animación en vivo** — ruleta de números antes de revelar al ganador.
- **Aleatoriedad criptográfica** — usa `crypto.getRandomValues()` para garantizar imparcialidad.
- **Sin repetición** — no se pueden seleccionar ganadores repetidos.
- **Diseño responsive** — funciona en dispositivos móviles y de escritorio.
- **Estilo consistente** — misma paleta de colores y diseño que marins.dev.
- **Sin librerías externas** — 100% HTML, CSS y JavaScript vanilla.
- **Compatible con GitHub Pages** — despliegue directo.

## Estructura

```
sorteo/
├── index.html    # Página principal del sorteador
├── style.css     # Estilos (tema oscuro marins.dev)
├── script.js     # Lógica del sorteo (ES6 vanilla)
└── README.md     # Este archivo
```

## Cómo usar

1. Abrir `https://marins.dev/sorteo/`
2. Configurar cantidad de números y cantidad de ganadores.
3. Clic en un número para asignar un participante.
4. Repetir hasta tener todos los participantes registrados.
5. Presionar **"Iniciar Sorteo"** para ver la animación.
6. Los ganadores se muestran con medalla dorada en el tablero.

## Licencia

MIT