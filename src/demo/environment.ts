type DemoEnvironment = {
  DEMO_MODE?: string;
  DEMO_ENVIRONMENT?: string;
  NODE_ENV?: string;
};

export function demoModeEnabled(environment: DemoEnvironment = process.env) {
  if (environment.DEMO_MODE !== "true") return false;
  if (environment.NODE_ENV !== "production") return true;
  return environment.DEMO_ENVIRONMENT === "approved";
}
