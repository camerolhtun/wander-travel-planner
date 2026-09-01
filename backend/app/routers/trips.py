import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.deps import CurrentUser, get_current_user
from app.models.db_models import ItineraryDay, Trip
from app.models.schemas import TripCreate, TripDetailOut, TripOut, TripUpdate
from app.services.itinerary import generate_itinerary

router = APIRouter(prefix="/trips", tags=["trips"])


async def _owned_trip(
    trip_id: uuid.UUID,
    user: CurrentUser,
    db: AsyncSession,
    *,
    with_days: bool = False,
) -> Trip:
    stmt = select(Trip).where(Trip.id == trip_id, Trip.user_id == user.id)
    if with_days:
        stmt = stmt.options(selectinload(Trip.days).selectinload(ItineraryDay.items))
    trip = await db.scalar(stmt)
    if trip is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Trip not found")
    return trip


@router.post("", response_model=TripOut, status_code=status.HTTP_201_CREATED)
async def create_trip(
    payload: TripCreate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Trip:
    trip = Trip(user_id=user.id, **payload.model_dump())
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return trip


@router.get("", response_model=list[TripOut])
async def list_trips(
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[Trip]:
    rows = await db.scalars(
        select(Trip).where(Trip.user_id == user.id).order_by(Trip.created_at.desc())
    )
    return list(rows)


@router.get("/{trip_id}", response_model=TripDetailOut)
async def get_trip(
    trip_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Trip:
    return await _owned_trip(trip_id, user, db, with_days=True)


@router.patch("/{trip_id}", response_model=TripOut)
async def update_trip(
    trip_id: uuid.UUID,
    payload: TripUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Trip:
    trip = await _owned_trip(trip_id, user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)
    await db.commit()
    await db.refresh(trip)
    return trip


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    trip = await _owned_trip(trip_id, user, db)
    await db.delete(trip)
    await db.commit()


@router.post("/{trip_id}/generate", response_model=TripDetailOut)
async def generate(
    trip_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Trip:
    trip = await _owned_trip(trip_id, user, db, with_days=True)
    try:
        await generate_itinerary(trip, db)
    except Exception as exc:  # noqa: BLE001 - surface a clean error to the client
        await db.rollback()
        raise HTTPException(
            status.HTTP_502_BAD_GATEWAY, f"Itinerary generation failed: {exc}"
        ) from exc
    await db.commit()
    db.expire_all()
    return await _owned_trip(trip_id, user, db, with_days=True)
