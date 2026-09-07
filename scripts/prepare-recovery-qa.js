// Generate an isolated fault-injection page inside the disposable build output.
// Normal builds remove these files; never add them to the production allowlist.
import {readFile,writeFile} from "node:fs/promises";
import {distDirectory} from "./build.js";
import path from "node:path";
const root=path.join(distDirectory,"runner");
const html=await readFile(path.join(root,"index.html"),"utf8");
await writeFile(path.join(root,"recovery.html"),html.replace(/src="game\.js\?v=[a-f0-9]+"/,'src="recovery-init.js"'));
await writeFile(path.join(root,"recovery-init.js"),`
const mode = new URLSearchParams(location.search).get('fault');
if (mode === 'graphics') {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type,...args) {
    return type.startsWith('webgl') ? null : original.call(this,type,...args);
  };
}
if (mode === 'storage') {
  Storage.prototype.getItem = function() { throw new Error('QA: storage unavailable'); };
  Storage.prototype.setItem = function() { throw new Error('QA: storage unavailable'); };
}
await import('./game.js');
`);
