export function classifyAuthCreateError(error: { code?: string; status?: number }): "no_effect" | "rejected" | "unknown" {
  if (error.code === "email_exists") return "no_effect";
  // These Admin API checks reject the request before it writes an Auth user.
  if ((error.status === 403 && error.code === "not_admin") ||
    (error.status === 422 && error.code === "weak_password")) return "rejected";
  return "unknown";
}
