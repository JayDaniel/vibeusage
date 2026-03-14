Deno.serve((req: Request) => {
  return new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
