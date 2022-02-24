<div align="center">

  <h1><code>Maģistra darbs</code></h1>

  <strong>Maģistra darba praktiskas daļās projekts.</strong>
</div>

## Projekta konfigurēšana

Lai būtu iespējams uzsākt sekojošo projektu, datorā ir jābūt sekojošās programmatūras:

Nodejs - https://nodejs.org/en/download/ <br>
Rust - https://www.rust-lang.org/tools/install <br>
Wasm pack - https://rustwasm.github.io/wasm-pack/installer/ <br>
Cargo generate - cargo install cargo-generate
<br>
Projekts tiek sadalīts uz 2 daļiem:
1) Rust local library and wasm builds (izvilkuma www mape)
2) Web serveris www mapē

Pirmā daļā ir nepieciešams izveidot wasm izējfaiļus, lai tos būtu iespējams izmantot WEB serverā pusē <br>
Projektā saknēs direktorijā ir jāizmanto komandu `wasm-pack build`
<br>
Otrā daļā ir nepieciešams pāriet uz www mapē un izsaukt sekojošas komandas:<br>
`npm i` // instalēt npm mezgļus <br>
`npm run build` // instālēt npm mezgļus <br>
`npm run server` // uzsākt serveri <br>

<br>
Tagad serveris nokonfigurēts uz localhost:3000
<br><br>
Projektā būtu iespējams redzēt WASM + Rust + OpenGL sākotnējo testēšanas programmu <br>
Projektā būtu iespējams redzēt WebGL sākotnējo testēšanas programmu <br>
WebGPU un Wasm + Rust + Vulkan realizācijas pagaidām nav uzsāktas, jo ir nepieciešams izlasīt atbilstošo literatūru<br>
