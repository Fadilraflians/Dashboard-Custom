// In-memory Redis double. Tracks value + TTL per key so we can assert the
// sliding-idle / absolute-cap behaviour without a real server.
interface Entry {
  value: string;
  ttl: number;
}
const store = new Map<string, Entry>();

const redisMock = {
  async set(key: string, value: string, opts?: { EX?: number }) {
    store.set(key, { value, ttl: opts?.EX ?? 0 });
  },
  async get(key: string) {
    return store.has(key) ? store.get(key)!.value : null;
  },
  async del(key: string) {
    store.delete(key);
  },
  async expire(key: string, ttl: number) {
    const e = store.get(key);
    if (e) e.ttl = ttl;
  },
};

jest.mock("./redis", () => ({
  getRedis: jest.fn(async () => redisMock),
  keyPrefix: () => "test:",
}));

import {
  createSession,
  getSession,
  destroySession,
  SESSION_IDLE_TTL_SECONDS,
  SESSION_ABSOLUTE_TTL_SECONDS,
} from "./session";

const user = { sub: "42", name: "Irfan", role: "Administrator", email: "a@b.c" };

describe("session — single active + TTL", () => {
  beforeEach(() => {
    store.clear();
    jest.restoreAllMocks();
  });

  it("default TTL: idle 900s, absolute 3600s", () => {
    expect(SESSION_IDLE_TTL_SECONDS).toBe(900);
    expect(SESSION_ABSOLUTE_TTL_SECONDS).toBe(3600);
  });

  it("createSession menyimpan record dengan TTL idle + pointer user", async () => {
    const id = await createSession(user, "jwt-token");
    const rec = store.get(`test:${id}`);
    expect(rec).toBeDefined();
    expect(rec!.ttl).toBe(900); // idle window just after login
    // user pointer -> this session id
    expect(store.get("test:user:42")?.value).toBe(id);
  });

  it("login baru menendang (hapus) session lama user yang sama", async () => {
    const first = await createSession(user, "jwt-1");
    expect(store.has(`test:${first}`)).toBe(true);

    const second = await createSession(user, "jwt-2");

    // old session deleted, pointer now points to the new one
    expect(store.has(`test:${first}`)).toBe(false);
    expect(store.get("test:user:42")?.value).toBe(second);
  });

  it("getSession lama mengembalikan null setelah disuperseksi login baru", async () => {
    const first = await createSession(user, "jwt-1");
    await createSession(user, "jwt-2"); // supersedes
    // first was deleted by createSession; a stale cookie resolves to null
    expect(await getSession(first)).toBeNull();
  });

  it("getSession me-refresh TTL idle (sliding) saat masih jauh dari cap", async () => {
    const id = await createSession(user, "jwt");
    // Simulate time passing then an access.
    store.get(`test:${id}`)!.ttl = 100; // pretend idle counted down
    const rec = await getSession(id);
    expect(rec).not.toBeNull();
    expect(store.get(`test:${id}`)!.ttl).toBe(900); // refreshed to idle window
  });

  it("getSession meng-expire bila absolute cap sudah lewat", async () => {
    const id = await createSession(user, "jwt");
    // Force absExp into the past.
    const raw = JSON.parse(store.get(`test:${id}`)!.value);
    raw.absExp = Math.floor(Date.now() / 1000) - 10;
    store.get(`test:${id}`)!.value = JSON.stringify(raw);

    expect(await getSession(id)).toBeNull();
    expect(store.has(`test:${id}`)).toBe(false); // key removed
  });

  it("getSession meng-clamp TTL ke sisa absolute menjelang cap", async () => {
    const id = await createSession(user, "jwt");
    // 5 minutes (300s) left until absolute cap.
    const raw = JSON.parse(store.get(`test:${id}`)!.value);
    raw.absExp = Math.floor(Date.now() / 1000) + 300;
    store.get(`test:${id}`)!.value = JSON.stringify(raw);

    await getSession(id);
    expect(store.get(`test:${id}`)!.ttl).toBe(300); // clamped, not 900
  });

  it("getSession null untuk id kosong/tidak ada", async () => {
    expect(await getSession(undefined)).toBeNull();
    expect(await getSession("tidak-ada")).toBeNull();
  });

  it("destroySession menghapus session dan pointer user", async () => {
    const id = await createSession(user, "jwt");
    await destroySession(id);
    expect(store.has(`test:${id}`)).toBe(false);
    expect(store.has("test:user:42")).toBe(false);
  });
});
