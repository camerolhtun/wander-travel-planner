import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import CurrentUser, get_current_user
from app.models.db_models import ItineraryDay, ItineraryItem, Trip
from app.models.schemas import ItemOut, ItemUpdate, ReorderRequest

router = APIRouter(tags=["items"])


async def _owned_item(item_id: uuid.UUID, user: CurrentUser, db: AsyncSession) -> ItineraryItem:
    stmt = (
        select(ItineraryItem)
        .join(ItineraryDay, ItineraryDay.id == ItineraryItem.day_id)
        .join(Trip, Trip.id == ItineraryDay.trip_id)
        .where(ItineraryItem.id == item_id, Trip.user_id == user.id)
    )
    item = await db.scalar(stmt)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Item not found")
    return item


# Declared before "/items/{item_id}" so "reorder" is not parsed as an id.
@router.post("/items/reorder")
async def reorder_items(
    payload: ReorderRequest,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, int]:
    for entry in payload.items:
        item = await _owned_item(entry.id, user, db)
        item.day_id = entry.day_id
        item.sort_order = entry.sort_order
    await db.commit()
    return {"updated": len(payload.items)}


@router.patch("/items/{item_id}", response_model=ItemOut)
async def update_item(
    item_id: uuid.UUID,
    payload: ItemUpdate,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ItineraryItem:
    item = await _owned_item(item_id, user, db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    item.is_user_edited = True
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(
    item_id: uuid.UUID,
    user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    item = await _owned_item(item_id, user, db)
    await db.delete(item)
    await db.commit()
