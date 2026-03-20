import asyncio
import os
from typing import List, Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import storage


class SensorUpdate(BaseModel):
    slot_code: str
    distance_cm: float = Field(..., ge=0)
    ts: Optional[str] = None


class RecordCreateRequest(BaseModel):
    slot_code: str
    distance_cm: float = Field(..., ge=0)
    ts: Optional[str] = None


class ReservationRequest(BaseModel):
    slot_id: int
    user_name: str
    start_time: str
    end_time: str


class ThresholdRequest(BaseModel):
    threshold: int = Field(..., ge=50, le=100)


class SlotCreateRequest(BaseModel):
    code: str


class ConnectionManager:
    def __init__(self) -> None:
        self.active: List[WebSocket] = []
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        async with self.lock:
            self.active.append(websocket)

    async def disconnect(self, websocket: WebSocket) -> None:
        async with self.lock:
            if websocket in self.active:
                self.active.remove(websocket)

    async def broadcast(self, message: dict) -> None:
        async with self.lock:
            websockets = list(self.active)
        for ws in websockets:
            try:
                await ws.send_json(message)
            except WebSocketDisconnect:
                await self.disconnect(ws)


app = FastAPI(title="Smart Parking System (Simulation)")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()


@app.on_event("startup")
async def startup_event() -> None:
    storage.init_db()
    storage.seed_default()


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/api/lot")
async def get_lot() -> dict:
    return storage.get_lot()


@app.get("/api/slots")
async def get_slots() -> dict:
    return storage.snapshot()


@app.post("/api/sensor/update")
async def sensor_update(payload: SensorUpdate) -> dict:
    try:
        slot = storage.update_slot_from_sensor(payload.slot_code, payload.distance_cm, payload.ts)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    alert = storage.maybe_create_alert()
    snapshot = storage.snapshot()
    await manager.broadcast({"type": "snapshot", "data": snapshot})
    if alert:
        await manager.broadcast({"type": "alert", "data": alert})
    return {"slot": slot, "alert": alert}


@app.post("/api/reservations")
async def create_reservation(payload: ReservationRequest) -> dict:
    try:
        reservation = storage.create_reservation(
            payload.slot_id,
            payload.user_name,
            payload.start_time,
            payload.end_time,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    snapshot = storage.snapshot()
    await manager.broadcast({"type": "snapshot", "data": snapshot})
    return reservation


@app.get("/api/reservations")
async def list_reservations(limit: int = 50) -> dict:
    return {"items": storage.list_reservations(limit)}


@app.get("/api/alerts")
async def get_alerts(limit: int = 20) -> dict:
    return {"items": storage.list_alerts(limit)}


@app.post("/api/records")
async def create_record(payload: RecordCreateRequest) -> dict:
    try:
        result = storage.create_sensor_record(payload.slot_code, payload.distance_cm, payload.ts)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    alert = storage.maybe_create_alert()
    snapshot = storage.snapshot()
    await manager.broadcast({"type": "snapshot", "data": snapshot})
    if alert:
        await manager.broadcast({"type": "alert", "data": alert})
    return {"item": result["record"], "slot": result["slot"], "alert": alert}


@app.get("/api/records")
async def list_records(
    limit: int = 50,
    slot_code: Optional[str] = None,
    start_ts: Optional[str] = None,
    end_ts: Optional[str] = None,
) -> dict:
    try:
        items = storage.list_sensor_records(limit, slot_code, start_ts, end_ts)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return {"items": items}


@app.post("/api/admin/threshold")
async def set_threshold(payload: ThresholdRequest) -> dict:
    storage.update_alert_threshold(payload.threshold)
    snapshot = storage.snapshot()
    await manager.broadcast({"type": "snapshot", "data": snapshot})
    return {"threshold": payload.threshold}


@app.post("/api/admin/slot")
async def create_slot(payload: SlotCreateRequest) -> dict:
    try:
        slot = storage.add_slot(payload.code)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    snapshot = storage.snapshot()
    await manager.broadcast({"type": "snapshot", "data": snapshot})
    return slot


@app.get("/api/analytics/occupancy")
async def occupancy(days: int = 7) -> dict:
    return storage.analytics(days)


@app.websocket("/api/slots/live")
async def slots_live(websocket: WebSocket) -> None:
    await manager.connect(websocket)
    try:
        await websocket.send_json({"type": "snapshot", "data": storage.snapshot()})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)


FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
