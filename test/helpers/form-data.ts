// Builds a FormData from a plain object. Values are coerced to strings, matching
// how a browser submits <form> fields. null/undefined values are skipped so a
// test can omit a field entirely.
export function formDataFrom(
  fields: Record<string, string | number | null | undefined>,
): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue
    fd.append(key, String(value))
  }
  return fd
}
