"""API router aggregation."""

from fastapi import APIRouter

from app.api.v1 import (
    account,
    assistant,
    comparisons,
    documents,
    family,
    health,
    jobs,
    shares,
    users,
    workspace,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(users.router)
api_router.include_router(workspace.router)
api_router.include_router(family.router)
api_router.include_router(documents.router)
api_router.include_router(jobs.router)
api_router.include_router(assistant.router)
api_router.include_router(comparisons.router)
api_router.include_router(shares.router)
api_router.include_router(account.router)
