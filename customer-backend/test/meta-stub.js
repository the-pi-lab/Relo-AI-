// Local stub for the Instagram Graph API (no real Meta calls in tests).
// Point the backend at it via META_GRAPH_HOST=127.0.0.1:<port>.
import http from "node:http";

export function startMetaStub() {
  const state = {
    requests: [],
    followStatus: true, // true | false | null (unverifiable)
    failSendsWith: null, // { status, error: { message, code, error_subcode } }
  };

  const server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
    });
    req.on("end", () => {
      let body = null;
      try {
        body = raw ? JSON.parse(raw) : null;
      } catch {
        body = raw;
      }
      state.requests.push({
        method: req.method,
        url: req.url,
        body,
        auth: req.headers.authorization || null,
      });
      const send = (code, obj) => {
        res.writeHead(code, { "Content-Type": "application/json" });
        res.end(JSON.stringify(obj));
      };
      if (req.method === "GET") {
        if (state.followStatus === null) return send(200, {});
        return send(200, { is_user_follow_business: state.followStatus });
      }
      if (state.failSendsWith) {
        return send(state.failSendsWith.status, { error: state.failSendsWith.error });
      }
      if (req.url.includes("/replies")) return send(200, { id: "REPLY1" });
      return send(200, { recipient_id: "USER1", message_id: "mid-stub" });
    });
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({
        state,
        port: server.address().port,
        reset() {
          state.requests = [];
          state.followStatus = true;
          state.failSendsWith = null;
        },
        close() {
          return new Promise((r) => server.close(r));
        },
      });
    });
  });
}
