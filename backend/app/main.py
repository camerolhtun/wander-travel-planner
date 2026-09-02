from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import days, health, inspiration, items, trips


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="AI Travel Planner API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(trips.router)
    app.include_router(days.router)
    app.include_router(items.router)
    app.include_router(inspiration.router)
    return app


app = create_app()
