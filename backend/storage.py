import os
import sqlite3
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple

BASE_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.environ.get("SPARK_DB", os.path.join(DATA_DIR, "parking.db"))

OCCUPIED_DISTANCE_CM = float(os.environ.get("SPARK_OCCUPIED_DISTANCE_CM", 30))


def _now_ts() -> str:
    return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"


def _parse_ts(ts: str) -> datetime:
    if ts.endswith("Z"):
        ts = ts[:-1]
    return datetime.fromisoformat(ts)


def _ensure_dirs() -> None:
    os.makedirs(DATA_DIR, exist_ok=True)


def get_conn() -> sqlite3.Connection:
    _ensure_dirs()
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS parking_lot (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            location TEXT NOT NULL,
            total_slots INTEGER NOT NULL,
            alert_threshold INTEGER NOT NULL DEFAULT 80,
            created_at TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS parking_slot (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lot_id INTEGER NOT NULL,
            code TEXT NOT NULL UNIQUE,
            status TEXT NOT NULL,
            last_update TEXT NOT NULL,
            reserved_until TEXT,
            reserved_by TEXT,
            FOREIGN KEY(lot_id) REFERENCES parking_lot(id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS sensor_event (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slot_id INTEGER NOT NULL,
            distance REAL NOT NULL,
            is_occupied INTEGER NOT NULL,
            ts TEXT NOT NULL,
            FOREIGN KEY(slot_id) REFERENCES parking_slot(id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS reservation (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slot_id INTEGER NOT NULL,
            user_name TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(slot_id) REFERENCES parking_slot(id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS alert (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lot_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            message TEXT NOT NULL,
            ts TEXT NOT NULL,
            FOREIGN KEY(lot_id) REFERENCES parking_lot(id)
        )
        """
    )
    conn.commit()
    conn.close()


def seed_default(lot_name: str = "Main Campus Lot", location: str = "Engineering Block", total_slots: int = 24) -> None:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) AS c FROM parking_lot")
    if cur.fetchone()[0] == 0:
        now = _now_ts()
        cur.execute(
            "INSERT INTO parking_lot(name, location, total_slots, alert_threshold, created_at) VALUES (?, ?, ?, ?, ?)",
            (lot_name, location, total_slots, 80, now),
        )
        lot_id = cur.lastrowid
        for i in range(total_slots):
            code = f"A{(i + 1):02d}"
            cur.execute(
                "INSERT INTO parking_slot(lot_id, code, status, last_update) VALUES (?, ?, ?, ?)",
                (lot_id, code, "free", now),
            )
        conn.commit()
    conn.close()


def _refresh_reservations(conn: sqlite3.Connection) -> None:
    now = _now_ts()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, slot_id, end_time FROM reservation WHERE status = 'active' AND end_time <= ?",
        (now,),
    )
    expired = cur.fetchall()
    if not expired:
        return
    for row in expired:
        cur.execute("UPDATE reservation SET status = 'expired' WHERE id = ?", (row["id"],))
        cur.execute(
            "SELECT status FROM parking_slot WHERE id = ?",
            (row["slot_id"],),
        )
        slot = cur.fetchone()
        if slot and slot["status"] == "reserved":
            cur.execute(
                "UPDATE parking_slot SET status = 'free', reserved_until = NULL, reserved_by = NULL WHERE id = ?",
                (row["slot_id"],),
            )
    conn.commit()


def list_slots() -> List[Dict[str, Any]]:
    conn = get_conn()
    _refresh_reservations(conn)
    cur = conn.cursor()
    cur.execute(
        "SELECT id, code, status, last_update, reserved_until, reserved_by FROM parking_slot ORDER BY code"
    )
    rows = cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_lot() -> Dict[str, Any]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM parking_lot LIMIT 1")
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else {}


def update_alert_threshold(threshold: int) -> None:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("UPDATE parking_lot SET alert_threshold = ?", (threshold,))
    conn.commit()
    conn.close()


def add_slot(code: str) -> Dict[str, Any]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM parking_lot LIMIT 1")
    lot = cur.fetchone()
    if not lot:
        conn.close()
        raise ValueError("No parking lot found")
    now = _now_ts()
    cur.execute(
        "INSERT INTO parking_slot(lot_id, code, status, last_update) VALUES (?, ?, ?, ?)",
        (lot["id"], code, "free", now),
    )
    cur.execute(
        "UPDATE parking_lot SET total_slots = total_slots + 1 WHERE id = ?",
        (lot["id"],),
    )
    conn.commit()
    cur.execute(
        "SELECT id, code, status, last_update, reserved_until, reserved_by FROM parking_slot WHERE id = ?",
        (cur.lastrowid,),
    )
    slot = cur.fetchone()
    conn.close()
    return dict(slot)


def _slot_by_code(cur: sqlite3.Cursor, code: str) -> Optional[sqlite3.Row]:
    cur.execute("SELECT * FROM parking_slot WHERE code = ?", (code,))
    return cur.fetchone()


def _record_sensor_event(
    slot_code: str,
    distance: float,
    ts: Optional[str] = None,
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    conn = get_conn()
    _refresh_reservations(conn)
    cur = conn.cursor()
    slot = _slot_by_code(cur, slot_code)
    if not slot:
        conn.close()
        raise ValueError("Slot not found")
    now = ts or _now_ts()
    occupied = distance < OCCUPIED_DISTANCE_CM

    # determine target status
    target_status = "occupied" if occupied else "free"
    if not occupied and slot["reserved_until"]:
        reserved_until = _parse_ts(slot["reserved_until"])
        if reserved_until > _parse_ts(now):
            target_status = "reserved"

    cur.execute(
        "UPDATE parking_slot SET status = ?, last_update = ? WHERE id = ?",
        (target_status, now, slot["id"]),
    )
    cur.execute(
        "INSERT INTO sensor_event(slot_id, distance, is_occupied, ts) VALUES (?, ?, ?, ?)",
        (slot["id"], distance, 1 if occupied else 0, now),
    )
    event_id = cur.lastrowid
    conn.commit()
    cur.execute(
        "SELECT id, code, status, last_update, reserved_until, reserved_by FROM parking_slot WHERE id = ?",
        (slot["id"],),
    )
    updated = cur.fetchone()
    cur.execute(
        """
        SELECT se.id, se.slot_id, ps.code AS slot_code, se.distance, se.is_occupied, se.ts
        FROM sensor_event se
        JOIN parking_slot ps ON ps.id = se.slot_id
        WHERE se.id = ?
        """,
        (event_id,),
    )
    event = cur.fetchone()
    conn.close()
    return dict(updated), dict(event)


def update_slot_from_sensor(slot_code: str, distance: float, ts: Optional[str] = None) -> Dict[str, Any]:
    updated, _ = _record_sensor_event(slot_code, distance, ts)
    return updated


def create_sensor_record(slot_code: str, distance: float, ts: Optional[str] = None) -> Dict[str, Any]:
    updated_slot, event = _record_sensor_event(slot_code, distance, ts)
    return {"slot": updated_slot, "record": event}


def list_sensor_records(
    limit: int = 50,
    slot_code: Optional[str] = None,
    start_ts: Optional[str] = None,
    end_ts: Optional[str] = None,
) -> List[Dict[str, Any]]:
    if start_ts:
        try:
            _parse_ts(start_ts)
        except ValueError:
            raise ValueError("Invalid start_ts format")
    if end_ts:
        try:
            _parse_ts(end_ts)
        except ValueError:
            raise ValueError("Invalid end_ts format")
    if start_ts and end_ts and _parse_ts(end_ts) < _parse_ts(start_ts):
        raise ValueError("end_ts must be after or equal to start_ts")

    conn = get_conn()
    cur = conn.cursor()
    query = [
        """
        SELECT se.id, se.slot_id, ps.code AS slot_code, se.distance, se.is_occupied, se.ts
        FROM sensor_event se
        JOIN parking_slot ps ON ps.id = se.slot_id
        """
    ]
    conditions: List[str] = []
    params: List[Any] = []
    if slot_code:
        conditions.append("ps.code = ?")
        params.append(slot_code)
    if start_ts:
        conditions.append("se.ts >= ?")
        params.append(start_ts)
    if end_ts:
        conditions.append("se.ts <= ?")
        params.append(end_ts)

    if conditions:
        query.append("WHERE " + " AND ".join(conditions))

    query.append("ORDER BY se.ts DESC")
    query.append("LIMIT ?")
    params.append(limit)

    cur.execute("\n".join(query), tuple(params))
    rows = cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def create_reservation(slot_id: int, user_name: str, start_time: str, end_time: str) -> Dict[str, Any]:
    conn = get_conn()
    _refresh_reservations(conn)
    cur = conn.cursor()
    try:
        start_dt = _parse_ts(start_time)
        end_dt = _parse_ts(end_time)
    except ValueError:
        conn.close()
        raise ValueError("Invalid time format")
    if end_dt <= start_dt:
        conn.close()
        raise ValueError("End time must be after start time")
    cur.execute(
        "SELECT status FROM parking_slot WHERE id = ?",
        (slot_id,),
    )
    slot = cur.fetchone()
    if not slot:
        conn.close()
        raise ValueError("Slot not found")
    if slot["status"] == "occupied":
        conn.close()
        raise ValueError("Slot is occupied")
    now = _now_ts()
    cur.execute(
        "INSERT INTO reservation(slot_id, user_name, start_time, end_time, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        (slot_id, user_name, start_time, end_time, "active", now),
    )
    cur.execute(
        "UPDATE parking_slot SET status = 'reserved', reserved_until = ?, reserved_by = ? WHERE id = ?",
        (end_time, user_name, slot_id),
    )
    conn.commit()
    reservation_id = cur.lastrowid
    cur.execute("SELECT * FROM reservation WHERE id = ?", (reservation_id,))
    reservation = cur.fetchone()
    conn.close()
    return dict(reservation)


def list_reservations(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_conn()
    _refresh_reservations(conn)
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM reservation ORDER BY created_at DESC LIMIT ?",
        (limit,),
    )
    rows = cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def list_alerts(limit: int = 20) -> List[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM alert ORDER BY ts DESC LIMIT ?", (limit,))
    rows = cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def _occupancy_metrics(conn: sqlite3.Connection) -> Dict[str, Any]:
    cur = conn.cursor()
    cur.execute("SELECT total_slots, alert_threshold FROM parking_lot LIMIT 1")
    lot = cur.fetchone()
    if not lot:
        return {"total": 0, "occupied": 0, "reserved": 0, "free": 0, "percent": 0, "threshold": 80}
    cur.execute("SELECT status, COUNT(*) AS c FROM parking_slot GROUP BY status")
    counts = {"occupied": 0, "reserved": 0, "free": 0}
    for row in cur.fetchall():
        counts[row["status"]] = row["c"]
    total = lot["total_slots"]
    taken = counts.get("occupied", 0) + counts.get("reserved", 0)
    percent = int(round((taken / total) * 100)) if total else 0
    return {
        "total": total,
        "occupied": counts.get("occupied", 0),
        "reserved": counts.get("reserved", 0),
        "free": counts.get("free", 0),
        "percent": percent,
        "threshold": lot["alert_threshold"],
    }


def maybe_create_alert() -> Optional[Dict[str, Any]]:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, alert_threshold FROM parking_lot LIMIT 1")
    lot = cur.fetchone()
    if not lot:
        conn.close()
        return None
    metrics = _occupancy_metrics(conn)
    if metrics["percent"] < metrics["threshold"]:
        conn.close()
        return None
    message = f"High occupancy: {metrics['percent']}% (threshold {metrics['threshold']}%)"
    now = _now_ts()
    cur.execute(
        "INSERT INTO alert(lot_id, type, message, ts) VALUES (?, ?, ?, ?)",
        (lot["id"], "occupancy", message, now),
    )
    conn.commit()
    cur.execute("SELECT * FROM alert WHERE id = ?", (cur.lastrowid,))
    row = cur.fetchone()
    conn.close()
    return dict(row)


def snapshot() -> Dict[str, Any]:
    conn = get_conn()
    _refresh_reservations(conn)
    cur = conn.cursor()
    cur.execute(
        "SELECT id, code, status, last_update, reserved_until, reserved_by FROM parking_slot ORDER BY code"
    )
    slots = [dict(row) for row in cur.fetchall()]
    metrics = _occupancy_metrics(conn)
    lot = get_lot()
    conn.close()
    return {"lot": lot, "slots": slots, "metrics": metrics}


def analytics(days: int = 7) -> Dict[str, Any]:
    conn = get_conn()
    cur = conn.cursor()
    since = (datetime.utcnow() - timedelta(days=days)).replace(microsecond=0).isoformat() + "Z"
    cur.execute(
        """
        SELECT substr(ts, 1, 10) AS day,
               SUM(is_occupied) AS occupied_events,
               COUNT(*) AS total_events
        FROM sensor_event
        WHERE ts >= ?
        GROUP BY day
        ORDER BY day ASC
        """,
        (since,),
    )
    daily = []
    for row in cur.fetchall():
        percent = int(round((row["occupied_events"] / row["total_events"]) * 100)) if row["total_events"] else 0
        daily.append(
            {
                "day": row["day"],
                "occupied_events": row["occupied_events"],
                "total_events": row["total_events"],
                "percent": percent,
            }
        )
    cur.execute(
        """
        SELECT substr(ts, 12, 2) AS hour,
               SUM(is_occupied) AS occupied_events
        FROM sensor_event
        WHERE ts >= ?
        GROUP BY hour
        ORDER BY occupied_events DESC
        LIMIT 1
        """,
        (since,),
    )
    peak = cur.fetchone()
    peak_hour = peak["hour"] if peak else None
    conn.close()
    return {"daily": daily, "peak_hour": peak_hour}
