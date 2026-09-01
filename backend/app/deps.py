import uuid
from functools import lru_cache

import jwt
from fastapi import Depends, Header, HTTPException, status
from jwt import PyJWKClient

from app.config import Settings, get_settings


class CurrentUser:
    def __init__(self, user_id: uuid.UUID, email: str | None = None) -> None:
        self.id = user_id
        self.email = email


@lru_cache
def _jwk_client(jwks_url: str) -> PyJWKClient:
    # PyJWKClient caches fetched keys and refreshes on unknown `kid`.
    return PyJWKClient(jwks_url, cache_keys=True)


def _decode(token: str, settings: Settings) -> dict:
    try:
        alg = jwt.get_unverified_header(token).get("alg", "")
    except jwt.PyJWTError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Malformed token") from exc

    options = {"verify_aud": True}
    audience = settings.supabase_jwt_audience

    if alg == "HS256":
        if not settings.supabase_jwt_secret:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "HS256 token received but SUPABASE_JWT_SECRET is not set",
            )
        key: object = settings.supabase_jwt_secret
    else:
        if not settings.supabase_jwks_url:
            raise HTTPException(
                status.HTTP_500_INTERNAL_SERVER_ERROR,
                "Asymmetric token received but SUPABASE_URL is not set",
            )
        key = _jwk_client(settings.supabase_jwks_url).get_signing_key_from_jwt(token).key

    return jwt.decode(
        token,
        key,
        algorithms=[alg] if alg else ["HS256", "ES256", "RS256"],
        audience=audience,
        options=options,
    )


def get_current_user(
    authorization: str | None = Header(default=None),
    x_dev_user: str | None = Header(default=None),
    settings: Settings = Depends(get_settings),
) -> CurrentUser:
    # Local convenience: skip Supabase entirely by passing `X-Dev-User: <uuid>`.
    if settings.environment == "development" and x_dev_user:
        return CurrentUser(uuid.UUID(x_dev_user), email="dev@example.com")

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")

    token = authorization.split(" ", 1)[1]
    try:
        payload = _decode(token, settings)
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED, f"Invalid token: {exc}"
        ) from exc

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing subject")
    return CurrentUser(uuid.UUID(sub), email=payload.get("email"))
