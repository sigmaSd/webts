import { existsSync } from "./deps.ts";

const INDEX_HTML = `
<!DOCTYPE html>
<html>
<head>
  <script src="index.js" type="module"></script>
  <script defer src="reload.js"></script>
  <button onclick="_app.hello()">Hello</button>
</head>
</html>
`;
const INDEX_TS = `
export function hello() {
  alert("hello world");
}

// @ts-ignore export to index.html
window._app = { hello };
`;
const RELOAD_JS = `
const reloader = new WebSocket("ws://localhost:8001");
reloader.onmessage = () => {
  window.location.reload();
};
`;
const DENO_JSON = `
{
  "compilerOptions": {
    "lib": [
      "deno.ns",
      "dom",
      "dom.iterable",
      "dom.asynciterable"
    ]
  },
  "exclude": [
    "index.js"
  ]
}
`;

export async function scaffold(projectName: string) {
  if (existsSync(projectName)) {
    throw new Error("direcotry already exists");
  }
  Deno.mkdirSync(projectName);
  Deno.writeTextFileSync(projectName + "/index.html", INDEX_HTML);
  Deno.writeTextFileSync(projectName + "/index.ts", INDEX_TS);
  Deno.writeTextFileSync(projectName + "/reload.js", RELOAD_JS);
  Deno.writeTextFileSync(projectName + "/deno.json", DENO_JSON);

  // fmt
  await new Deno.Command("deno", {
    args: ["fmt"],
    cwd: projectName,
    stdout: "null",
    stderr: "null",
  })
    .spawn()
    .status;
}
