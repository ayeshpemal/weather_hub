import { auth } from "express-oauth2-jwt-bearer";

const issuerBaseURL = process.env.AUTH0_ISSUER_BASE_URL;
const audience = process.env.AUTH0_AUDIENCE;

if (!issuerBaseURL || !audience) {
  throw new Error("Auth0 config missing. Set AUTH0_ISSUER_BASE_URL and AUTH0_AUDIENCE in .env");
}

export const checkJwt = auth({
  audience,
  issuerBaseURL,
  tokenSigningAlg: "RS256",
});
