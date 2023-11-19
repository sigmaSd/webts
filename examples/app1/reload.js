const reloader = new WebSocket("ws://localhost:8001");
reloader.onmessage = () => {
  window.location.reload();
};
