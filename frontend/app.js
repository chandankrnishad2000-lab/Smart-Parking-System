const qs = (sel) => document.querySelector(sel);
const apiBase = "";
let currentSnapshot = null;
let currentRecords = [];

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toIsoOrNull(localValue) {
  if (!localValue) return null;
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadRecordsCsv(items) {
  if (!items.length) return;
  const header = ["id", "timestamp", "slot_code", "distance_cm", "is_occupied"];
  const lines = [header.map(csvEscape).join(",")];
  items.forEach((record) => {
    lines.push(
      [record.id, record.ts, record.slot_code, Number(record.distance).toFixed(1), Number(record.is_occupied)]
        .map(csvEscape)
        .join(",")
    );
  });
  const content = `${lines.join("\n")}\n`;
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().replaceAll(":", "-").slice(0, 19);
  anchor.href = url;
  anchor.download = `sensor-records-${stamp}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function fetchJSON(path, options = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Request failed");
  }
  return res.json();
}

function updateStatus(text) {
  qs("#system-status").textContent = text;
  qs("#last-update").textContent = `Last update: ${new Date().toLocaleTimeString()}`;
}

function renderLotMeta(lot) {
  if (!lot || !lot.name) return;
  qs("#lot-meta").innerHTML = `<span>${lot.name}</span><span>${lot.location}</span>`;
}

function renderMetrics(metrics) {
  qs("#occupancy-percent").textContent = `${metrics.percent}%`;
  qs("#occupied-count").textContent = metrics.occupied;
  qs("#reserved-count").textContent = metrics.reserved;
  qs("#free-count").textContent = metrics.free;
  qs("#total-count").textContent = metrics.total;
  qs("#threshold-range").value = metrics.threshold;
  qs("#threshold-value").textContent = `${metrics.threshold}%`;
}

function renderSlots(slots) {
  const grid = qs("#slots-grid");
  grid.innerHTML = "";
  slots.forEach((slot) => {
    const el = document.createElement("div");
    el.className = `slot ${slot.status}`;
    el.innerHTML = `<div>${slot.code}</div><div class="tiny">${slot.status}</div>`;
    el.addEventListener("click", () => toggleSlot(slot));
    grid.appendChild(el);
  });

  const dropdown = qs("#reservation-slot");
  dropdown.innerHTML = "";
  const recordSlotDropdown = qs("#record-slot");
  if (recordSlotDropdown) {
    recordSlotDropdown.innerHTML = "";
  }
  const recordsFilter = qs("#records-slot-filter");
  const previousFilter = recordsFilter ? recordsFilter.value : "";
  if (recordsFilter) {
    recordsFilter.innerHTML = '<option value="">All slots</option>';
  }

  slots.forEach((slot) => {
    const option = document.createElement("option");
    option.value = slot.id;
    option.textContent = `${slot.code} (${slot.status})`;
    dropdown.appendChild(option);

    if (recordSlotDropdown) {
      const sensorOption = document.createElement("option");
      sensorOption.value = slot.code;
      sensorOption.textContent = `${slot.code} (${slot.status})`;
      recordSlotDropdown.appendChild(sensorOption);
    }

    if (recordsFilter) {
      const filterOption = document.createElement("option");
      filterOption.value = slot.code;
      filterOption.textContent = slot.code;
      recordsFilter.appendChild(filterOption);
    }
  });

  if (recordsFilter && previousFilter) {
    recordsFilter.value = previousFilter;
  }
}

async function toggleSlot(slot) {
  const distance = slot.status === "occupied" ? 120 : 15;
  try {
    await fetchJSON("/api/sensor/update", {
      method: "POST",
      body: JSON.stringify({ slot_code: slot.code, distance_cm: distance }),
    });
  } catch (err) {
    console.error(err);
  }
}

function renderAlerts(alerts) {
  const list = qs("#alerts-list");
  list.innerHTML = "";
  if (!alerts.length) {
    const li = document.createElement("li");
    li.textContent = "No alerts yet";
    list.appendChild(li);
    return;
  }
  alerts.forEach((alert) => {
    const li = document.createElement("li");
    li.textContent = `${alert.message} (${alert.ts})`;
    list.appendChild(li);
  });
}

function renderRecords(items) {
  const body = qs("#records-body");
  if (!body) return;
  currentRecords = items;
  body.innerHTML = "";
  if (!items.length) {
    const row = document.createElement("tr");
    row.innerHTML = '<td colspan="4" class="tiny">No records yet</td>';
    body.appendChild(row);
    return;
  }

  items.forEach((record) => {
    const row = document.createElement("tr");
    const occupied = Number(record.is_occupied) === 1 ? "Yes" : "No";
    row.innerHTML = `
      <td>${escapeHtml(record.ts || "--")}</td>
      <td>${escapeHtml(record.slot_code || "--")}</td>
      <td>${escapeHtml(Number(record.distance).toFixed(1))} cm</td>
      <td>${occupied}</td>
    `;
    body.appendChild(row);
  });
}

function drawChart(data) {
  const canvas = qs("#occupancy-chart");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!data.length) {
    ctx.fillStyle = "#94a3b8";
    ctx.font = "14px Space Grotesk";
    ctx.fillText("No analytics data yet", 20, 40);
    return;
  }

  const padding = 30;
  const width = canvas.width - padding * 2;
  const height = canvas.height - padding * 2;
  const barWidth = width / data.length;

  ctx.fillStyle = "#60a5fa";
  ctx.strokeStyle = "#e2e8f0";
  ctx.font = "12px Space Grotesk";

  data.forEach((d, i) => {
    const barHeight = (d.percent / 100) * height;
    const x = padding + i * barWidth;
    const y = canvas.height - padding - barHeight;
    ctx.fillRect(x + 8, y, barWidth - 16, barHeight);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(d.percent + "%", x + 8, y - 6);
    ctx.fillStyle = "#60a5fa";
    ctx.fillText(d.day.slice(5), x + 8, canvas.height - 10);
  });
}

async function loadAnalytics() {
  try {
    const analytics = await fetchJSON("/api/analytics/occupancy?days=7");
    drawChart(analytics.daily || []);
    qs("#peak-hour").textContent = analytics.peak_hour ? `${analytics.peak_hour}:00` : "--";
  } catch (err) {
    console.error(err);
  }
}

async function loadAlerts() {
  try {
    const alerts = await fetchJSON("/api/alerts?limit=6");
    renderAlerts(alerts.items || []);
  } catch (err) {
    console.error(err);
  }
}

async function loadRecords() {
  const limitEl = qs("#records-limit");
  const slotFilterEl = qs("#records-slot-filter");
  const startEl = qs("#records-start");
  const endEl = qs("#records-end");
  if (!limitEl || !slotFilterEl || !startEl || !endEl) return;
  const limit = Number(limitEl.value || 20);
  const slotCode = slotFilterEl.value;
  const query = new URLSearchParams({ limit: String(limit) });
  if (slotCode) {
    query.set("slot_code", slotCode);
  }
  const startIso = toIsoOrNull(startEl.value);
  const endIso = toIsoOrNull(endEl.value);
  if (startIso) {
    query.set("start_ts", startIso);
  }
  if (endIso) {
    query.set("end_ts", endIso);
  }
  try {
    const result = await fetchJSON(`/api/records?${query.toString()}`);
    renderRecords(result.items || []);
  } catch (err) {
    console.error(err);
  }
}

function handleSnapshot(snapshot) {
  currentSnapshot = snapshot;
  renderLotMeta(snapshot.lot);
  renderMetrics(snapshot.metrics);
  renderSlots(snapshot.slots);
  updateStatus("Online");
}

async function init() {
  const endInput = qs("#reservation-end");
  endInput.value = toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000));
  const recordsStart = qs("#records-start");
  const recordsEnd = qs("#records-end");
  recordsEnd.value = toLocalInputValue(new Date());
  recordsStart.value = toLocalInputValue(new Date(Date.now() - 24 * 60 * 60 * 1000));

  try {
    const snapshot = await fetchJSON("/api/slots");
    handleSnapshot(snapshot);
  } catch (err) {
    updateStatus("Offline");
  }

  loadAnalytics();
  loadAlerts();
  loadRecords();
  setInterval(loadAnalytics, 30000);
  setInterval(loadAlerts, 15000);
  setInterval(loadRecords, 15000);

  const wsProtocol = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${wsProtocol}://${location.host}/api/slots/live`);
  ws.onopen = () => updateStatus("Online");
  ws.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === "snapshot") {
      handleSnapshot(payload.data);
      loadRecords();
    }
    if (payload.type === "alert") {
      loadAlerts();
    }
  };
  ws.onclose = () => updateStatus("Disconnected");

  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send("ping");
    }
  }, 30000);

  qs("#reservation-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const slotId = Number(qs("#reservation-slot").value);
    const userName = qs("#reservation-name").value.trim();
    const endValue = qs("#reservation-end").value;
    const msg = qs("#reservation-message");
    msg.textContent = "";
    if (!userName) {
      msg.textContent = "Name is required";
      return;
    }
    try {
      const start = new Date();
      const end = new Date(endValue);
      await fetchJSON("/api/reservations", {
        method: "POST",
        body: JSON.stringify({
          slot_id: slotId,
          user_name: userName,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
        }),
      });
      msg.textContent = "Reservation created";
      msg.style.color = "#22c55e";
    } catch (err) {
      msg.textContent = err.message;
      msg.style.color = "#f87171";
    }
  });

  qs("#threshold-range").addEventListener("input", (event) => {
    qs("#threshold-value").textContent = `${event.target.value}%`;
  });

  qs("#threshold-save").addEventListener("click", async () => {
    const threshold = Number(qs("#threshold-range").value);
    try {
      await fetchJSON("/api/admin/threshold", {
        method: "POST",
        body: JSON.stringify({ threshold }),
      });
    } catch (err) {
      console.error(err);
    }
  });

  qs("#record-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const slotCode = qs("#record-slot").value;
    const distance = Number(qs("#record-distance").value);
    const msg = qs("#record-message");
    msg.textContent = "";
    if (!slotCode) {
      msg.textContent = "Please choose a slot";
      return;
    }
    if (Number.isNaN(distance) || distance < 0) {
      msg.textContent = "Distance must be a valid number";
      return;
    }
    try {
      await fetchJSON("/api/records", {
        method: "POST",
        body: JSON.stringify({
          slot_code: slotCode,
          distance_cm: distance,
        }),
      });
      msg.textContent = "Record saved";
      msg.style.color = "#22c55e";
      loadRecords();
    } catch (err) {
      msg.textContent = err.message;
      msg.style.color = "#f87171";
    }
  });

  qs("#records-refresh").addEventListener("click", () => {
    loadRecords();
  });

  qs("#records-slot-filter").addEventListener("change", () => {
    loadRecords();
  });

  qs("#records-limit").addEventListener("change", () => {
    loadRecords();
  });

  qs("#records-start").addEventListener("change", () => {
    loadRecords();
  });

  qs("#records-end").addEventListener("change", () => {
    loadRecords();
  });

  qs("#records-export").addEventListener("click", () => {
    downloadRecordsCsv(currentRecords);
  });
}

init();
