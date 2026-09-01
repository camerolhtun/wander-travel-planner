import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.deps import CurrentUser, get_current_user
from app.models.db_models import ItineraryDay, ItineraryItem, Trip
from app.models.schemas import DayOut, DayUpdate, ItemCreate, ItemOut

router = APIRouter(tags=["days"])


async def _owned_day(day_id: uuid.UUID, user: CurrentUser, db: AsyncSession) -> ItineraryDay:
    stmt = (
        select(ItineraryDay)
        .join(Trip, Trip.id == ItineraryDay.trip_id)
        .where(ItineraryDay.id == day_id, Trip.user_id == user.id)
        .options(selectinload(ItineraryDay.items))
    )
    day = await db.scalar(stmt)
    if day is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Day not found")
    return day


@router.patch("/days/{day_id}", response_model=DayOut)
async def update_day(
    day_id: uuid.UUID,
    payload: DayUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ItineraryDay:
    day = await _owned_day(day_id, user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(day, field, value)
    day.is_user_edited = True
    await db.commit()
    return await _owned_day(day_id, user, db)


@router.post(
    "/days/{day_id}/items", response_model=ItemOut, status_code=status.HTTP_201_CREATED
)
async def add_item(
    day_id: uuid.UUID,
    payload: ItemCreate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ItineraryItem:
    day = await _owned_day(day_id, user, db)
    item = ItineraryItem(day_id=day.id, is_user_edited=True, **payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item
