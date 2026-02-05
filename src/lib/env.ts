type NumberEnvOptions = {
  min?: number;
  max?: number;
};

export function readStringEnv(name: string, fallback: string): string {
  const value = process.env[name];
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : fallback;
}

export function readNumberEnv(
  name: string,
  fallback: number,
  options: NumberEnvOptions = {},
): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value)) return fallback;
  if (options.min !== undefined && value < options.min) return fallback;
  if (options.max !== undefined && value > options.max) return fallback;
  return value;
}
