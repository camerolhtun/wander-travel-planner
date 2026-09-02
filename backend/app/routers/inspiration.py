from fastapi import APIRouter

from app.models.schemas import ArticleOut
from app.services.inspiration import INTEREST_KEYWORDS, get_inspiration

router = APIRouter(prefix="/inspiration", tags=["inspiration"])


@router.get("/interests", response_model=list[str])
async def list_interests() -> list[str]:
    return list(INTEREST_KEYWORDS)


@router.get("/{interest}", response_model=list[ArticleOut])
async def list_articles(interest: str) -> list[dict]:
    return await get_inspiration(interest)
