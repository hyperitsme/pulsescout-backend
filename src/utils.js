export const ok = (res, data = {}) => res.json(data);
export const bad = (res, code, message) => res.status(code).json({ error: message });

export function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }

export function nowISO(){ return new Date().toISOString(); }

export function sseHeaders(res){
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "Access-Control-Expose-Headers": "*"
  });
  res.write("\n");
}
export function sseSend(res, data){
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}
