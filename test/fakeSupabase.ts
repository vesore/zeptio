// Minimal in-memory stand-in for the Supabase query builder: supports the
// select/eq/maybeSingle/insert/upsert/update chains the app uses, filters rows
// by .eq() clauses, and records every write for assertions.

type Row = Record<string, unknown>

export interface Write {
  table: string
  op: 'insert' | 'upsert' | 'update'
  payload: unknown
}

export function fakeSupabase({
  user = { id: 'user-1' },
  tables = {},
}: {
  user?: { id: string; email?: string } | null
  tables?: Record<string, Row[]>
} = {}) {
  const writes: Write[] = []

  function from(table: string) {
    const filters: Array<[string, unknown]> = []
    const rows = () => (tables[table] ?? []).filter(r => filters.every(([k, v]) => r[k] === v))
    const ok = { data: null, error: null }

    const builder = {
      select: () => builder,
      order: () => builder,
      eq: (key: string, value: unknown) => { filters.push([key, value]); return builder },
      maybeSingle: async () => ({ data: rows()[0] ?? null, error: null }),
      insert: async (payload: unknown) => { writes.push({ table, op: 'insert', payload }); return ok },
      upsert: async (payload: unknown) => { writes.push({ table, op: 'upsert', payload }); return ok },
      update: (payload: unknown) => { writes.push({ table, op: 'update', payload }); return builder },
      then: <T>(resolve: (v: { data: Row[]; error: null }) => T, reject?: (e: unknown) => T) =>
        Promise.resolve({ data: rows(), error: null }).then(resolve, reject),
    }
    return builder
  }

  const client = {
    auth: { getUser: async () => ({ data: { user } }) },
    from,
  }

  return { client, writes }
}
