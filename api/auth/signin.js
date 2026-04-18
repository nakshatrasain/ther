import { methodNotAllowed, readJson, sendJson, signIn } from "../_lib.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    methodNotAllowed(response, ["POST"]);
    return;
  }

  try {
    const payload = (await readJson(request)) || {};
    const email = String(payload.email || "").trim();
    const password = String(payload.password || "").trim();

    if (!email || !password) {
      sendJson(response, { error: "Email and password are required" }, 400);
      return;
    }

    const result = await signIn({ email, password });

    if (!result || typeof result !== "object") {
      throw new Error("Supabase signin returned an empty response");
    }

    const user = result.user || {};
    const userMetadata = user.user_metadata || {};

    sendJson(response, {
      user: {
        id: user.id || "",
        email: user.email || email,
        name: userMetadata.name || "",
      },
      session: {
        access_token: result.access_token || "",
        refresh_token: result.refresh_token || "",
        expires_in: result.expires_in || 0,
        token_type: result.token_type || "bearer",
      },
      requires_confirmation: false,
    });
  } catch (error) {
    console.error("signin handler error", error);
    sendJson(response, { error: error.message || "Sign in failed" }, error.status || 500);
  }
}
