export function hello() {
  alert("hello world");
}

// @ts-ignore export to index.html
window._app = { hello };
