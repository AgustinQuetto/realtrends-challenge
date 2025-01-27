![RealTrends](./logo.svg "RealTrends")

# RealTrends challenge
Se debe crear una aplicación de votación realtime. ✔

## API
* Debe exponer un servidor de websocket al que se pueda subscribir. ✔
* Debe emitir eventos cuando haya votos nuevos. ✔

## Cliente
* Debe haber al menos dos productos sobre los cuales se pueda votar. ✔
* Se debe mostrar un indicador del porcentaje de votos de cada producto. ✔
* Se debe poder ver quienes fueron los votantes y sus respectivas valoraciónes. ✔
* Cada usuario puede votar una vez, si vota más de una, el voto se transfiere. ✔

## Definiciones técnicas
* La aplicación debe estar publicada y debe ser accesible mediante un link.
* El código de la aplicación debe estar subida a un repositorio de público acceso. ✔

## Puntos extra
* El usuario puede seleccionar los productos desde el cliente viendo un modal con productos de Mercado Libre. ✔
* La votación se puede pausar, reanudar y reiniciar desde el cliente. ✔

## Correr el proyecto
```bash
## Instalar las dependencias del proyecto
npm install

## Instalar las dependencias de los paquetes
npm run bootstrap

## Correr los paquetes
npm run dev
```

## Aclaraciones personales
* Es posible crear múltiples votaciones con límite de una por usuario.
* Para crear una votación perteneciente a un canal de forma directa se debe entrar al path `/username` o completando el usuario `/`.
* Las votaciones se realizan desde el canal de Twitch.tv perteneciente al usuario.
* Para iniciar una votación se deben haber seleccionado mínimo 2 elementos.
* El comando para la votación es `!VOTE LETRA_ASIGNADA_O_MELI_PRODUCT_ID MENSJAE DE OPINIÓN`
* Se pueden añadir y eliminar elementos de la votación en tiempo real.
* Eliminados todos los elementos, la encuesta es eliminada.
* `server/src/controllers/PollController.ts` contiene el manager encargado de la gestión de las encuestas y escucha de comandos.
* Se desarrolló utilizando objetos y claves, para realizar la menor cantidad de iteraciones y búsquedas posibles en el servidor.
* La escucha al canal de Twitch comienza cuando se activa una encuesta.
* Los comandos son detectados y extraídos utilizando RegEx. Se puede extender a otras funcionabilidades parametrizadas.
* Por cada canal se asigna a un room de key `channel`. Se puede gestionar `la misma votación del canal` desde pestañas o ubicaciones distintas, mientras otros canales tienen las suyas propias.
* Una vez creada una opción, la asignación de letra no es reutilizable. Esto se hizo para prevenir "votos" de elementos erróneos del usuario creyendo que pertenecía a una opción anterior. Al llegar a la Z, se genera un id AA consecutivamente.

En honor a Gonzy y su pasión por TypeScript y piedad por errores de tipado en React 🤓.

![Meme](https://memegenerator.net/img/instances/81307932.jpg "Meme")