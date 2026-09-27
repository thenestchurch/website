type Environment = Readonly<Record<string, string | undefined>>;

export type SupabasePublicEnvironment = {
  publishableKey: string;
  url: string;
};

export type SupabasePrivilegedEnvironment = SupabasePublicEnvironment & {
  secretKey: string;
};

export const readPublicOperationsSecret = (environment: Environment) =>
  requireEnvironmentValue(environment, "PUBLIC_OPERATIONS_SECRET");

const requireEnvironmentValue = (environment: Environment, name: string) => {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required to initialize Supabase.`);
  }

  return value;
};

export const readSupabasePublicEnvironment = (
  environment: Environment,
): SupabasePublicEnvironment => ({
  publishableKey: requireEnvironmentValue(environment, "SUPABASE_PUBLISHABLE_KEY"),
  url: requireEnvironmentValue(environment, "SUPABASE_URL"),
});

export const readSupabasePrivilegedEnvironment = (
  environment: Environment,
): SupabasePrivilegedEnvironment => ({
  ...readSupabasePublicEnvironment(environment),
  secretKey: requireEnvironmentValue(environment, "SUPABASE_SECRET_KEY"),
});
