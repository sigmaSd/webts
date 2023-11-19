import { bundle, exists, serveDir } from "./deps.ts";
import { scaffold } from "./scaffold.ts";

function startServer({ port }: { port: number }) {
  Deno.serve({ port }, (req) => {
    return serveDir(req, { fsRoot: "." });
  });
}

class Watcher {
  #clients: {
    regex: RegExp;
    callback: () => void | Promise<void>;
  }[] = [];
  constructor() {}
  static start() {
    const self = new Watcher();
    (async () => {
      const DEBOUNCE = 200 /*ms*/;
      let id;
      for await (const ev of Deno.watchFs(".")) {
        if (id) clearTimeout(id);
        id = setTimeout(async () => {
          const path = ev.paths[0];
          await self.#notify(path);
        }, DEBOUNCE);
      }
    })();
    return self;
  }
  async #notify(path: string) {
    for (const client of this.#clients) {
      if (path.match(client.regex)) {
        await client.callback();
      }
    }
  }
  register(regex: RegExp, callback: () => void) {
    this.#clients.push({ regex, callback });
  }
}

async function bundler() {
  if (!await exists("index.ts")) return;

  let { code } = await bundle(
    new URL("file:///" + Deno.cwd() + "/index.ts"),
  );

  // - if `index.ts` contains an exported function, the bundled js will contain that export, which is not allowed in a javascript with type!=module
  // - if we remove the export keyword, the function wont be bundled at all
  // - the third option is to use js type=module but that makes the script variables unaccessible from the outside (without some hacks)
  //
  // we just go with option 1, bundle the exported functions, then remove that export from the bundled file
  let lines = code.trim().split("\n");
  if (lines.at(-1)?.startsWith("export {")) {
    lines = lines.slice(0, -1);
  }
  code = lines.join("\n");

  Deno.writeTextFileSync(
    "index.js",
    "// THIS FILE IS AUTO-GENERATED, DO NOT EDIT\n" + code,
  );
}

class Reloader {
  #sockets: Map<number, WebSocket> = new Map();
  #id = 0;
  constructor({ port }: { port: number }) {
    Deno.serve({ port }, (req) => {
      if (req.headers.get("upgrade") != "websocket") {
        return new Response(null, { status: 501 });
      }

      const { socket, response } = Deno.upgradeWebSocket(req);

      socket.onopen = () => {
        this.#sockets.set(this.#id, socket);
      };
      socket.onclose = () => {
        this.#sockets.delete(this.#id);
      };

      this.#id++;
      return response;
    });
  }
  reload() {
    this.#sockets.forEach((socket) => socket.send("reload"));
  }
}

if (import.meta.main) {
  if (Deno.args[0] === "init") {
    const projectName = Deno.args[1] || prompt("name?> ");
    if (!projectName) throw new Error("no project name");
    await scaffold(projectName);
    Deno.exit(0);
  }

  startServer({ port: 8000 });
  const reloader = new Reloader({ port: 8001 });
  const watcher = Watcher.start();
  await bundler();

  watcher.register(/\.js$|\.html$|\.css$/, () => reloader.reload());
  watcher.register(/\.ts$/, bundler);
}
