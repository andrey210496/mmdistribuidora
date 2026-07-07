// Next chama register() uma vez quando o servidor sobe. Usamos para ligar o
// loop de sincronizacao do PDV (F5.2) — so no modo pdv e no runtime Node.
// O guard POSITIVO `=== "nodejs"` envolvendo os imports faz o webpack NAO
// empacotar esse grafo (prisma etc.) no bundle de edge do middleware.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { IS_PDV } = await import("./lib/mode");
    if (!IS_PDV) return;
    const { startSyncRunner } = await import("./lib/sync-runner");
    startSyncRunner();
  }
}
