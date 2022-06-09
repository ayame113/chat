import {
  serve,
  Status,
  STATUS_TEXT,
} from "https://deno.land/std@0.142.0/http/mod.ts";
import {
  serveDir,
  serveFile,
} from "https://deno.land/std@0.142.0/http/file_server.ts";

const encoder = new TextEncoder();
serve(async (request) => {
  const { pathname } = new URL(request.url);
  if (request.method.toLowerCase() === "post") {
    if (pathname === "/post_message") {
      const data = await request.text();
      const channel = new BroadcastChannel("message");
      channel.postMessage(data);
      setTimeout(() => {
        channel.close();
      }, 500);
      console.log(data);
      return new Response(STATUS_TEXT.get(Status.OK));
    }
  }

  if (request.method.toLowerCase() === "get") {
    if (pathname.startsWith("/static")) {
      return serveDir(request);
    }
    if (pathname === "/") {
      return serveFile(request, "./index.html");
    }
    if (pathname === "/post") {
      return serveFile(request, "./post.html");
    }
    if (pathname === "/message") {
      const channel = new BroadcastChannel("message");
      const { writable, readable } = new TransformStream({
        flush() {
          channel.close();
        },
      });
      const writer = writable.getWriter();
      channel.addEventListener("message", (e) => {
        writer.write(encoder.encode(`${e.data}`));
      });
      return new Response(readable);
    }
  }
  return new Response(STATUS_TEXT.get(Status.NotFound), {
    status: Status.NotFound,
  });
});
