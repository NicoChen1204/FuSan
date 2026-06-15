// FuSan-FaDaTsai
// 使用方式：
// 1. 建立 Google Sheet，欄位請照 README.md。
// 2. 檔案 → 共用 → 發布到網路 → CSV。
// 3. 把 CSV 網址貼到下面 GOOGLE_SHEET_CSV_URL。

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQcK9pYxPUdPbxvARsKTPHTzuyHsPyaMITAibNrYLrExXiGVzFOaNLF-TwgPvzeA10aJCjQJlxbWoyi/pub?gid=0&single=true&output=csv";

const ALLOCATION = [
  { name: "分配 A", ratio: 0.75 },
  { name: "分配 B", ratio: 0.25 },
];

const POINT_VALUE = {
  "台指期": 200,
  "大台": 200,
  "小台": 50,
};

const SAMPLE_TRADES = [
  {
    id: "S001",
    date: "2026-06-01",
    product: "台指期",
    direction: "多",
    status: "已平倉",
    contracts: 1,
    entryPrice: 22100,
    exitPrice: 22280,
    pointValue: 200,
    fee: 600,
    tax: 0,
    realizedPnl: 35400,
    note: "範例資料：突破進場",
  },
  {
    id: "S002",
    date: "2026-06-05",
    product: "小台",
    direction: "空",
    status: "已平倉",
    contracts: 2,
    entryPrice: 22450,
    exitPrice: 22380,
    pointValue: 50,
    fee: 300,
    tax: 0,
    realizedPnl: 6700,
    note: "範例資料：壓力區反轉",
  },
  {
    id: "S003",
    date: "2026-06-10",
    product: "台指期",
    direction: "多",
    status: "未平倉",
    contracts: 1,
    entryPrice: 22620,
    exitPrice: "",
    pointValue: 200,
    fee: 0,
    tax: 0,
    realizedPnl: "",
    note: "範例資料：目前持倉",
  },
  {
    id: "S004",
    date: "2026-06-12",
    product: "小台",
    direction: "空",
    status: "未平倉",
    contracts: 3,
    entryPrice: 22710,
    exitPrice: "",
    pointValue: 50,
    fee: 0,
    tax: 0,
    realizedPnl: "",
    note: "範例資料：目前持倉",
  },
];

let trades = [];
let pnlChart = null;

const currency = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0,
});

function formatCurrency(value) {
  const num = Number(value) || 0;
  return currency.format(num);
}

function formatNumber(value) {
  return new Intl.NumberFormat("zh-TW").format(Number(value) || 0);
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function toNumber(value) {
  if (value === null || value === undefined || value === "") return 0;
  return Number(String(value).replace(/,/g, "")) || 0;
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function parseCsv(csvText) {
  const lines = csvText.replace(/\r/g, "").split("\n").filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });
    return row;
  });
}

function normalizeTrade(row, index) {
  const product = normalizeText(row.product || row.商品);
  const direction = normalizeText(row.direction || row.方向);
  const status = normalizeText(row.status || row.狀態);
  const contracts = toNumber(row.contracts || row.口數);
  const entryPrice = toNumber(row.entryPrice || row.進場價 || row.進場);
  const exitPriceRaw = row.exitPrice || row.出場價 || row.出場;
  const exitPrice = exitPriceRaw === "" ? "" : toNumber(exitPriceRaw);
  const pointValue = toNumber(row.pointValue || row.每點價值) || POINT_VALUE[product] || 200;
  const fee = toNumber(row.fee || row.手續費);
  const tax = toNumber(row.tax || row.交易稅);
  const realizedRaw = row.realizedPnl || row.實現損益 || row.pnl || row.PnL;
  const calculatedPnl = calculateRealizedPnl({ direction, status, contracts, entryPrice, exitPrice, pointValue, fee, tax });

  return {
    id: normalizeText(row.id || row.ID) || `T${index + 1}`,
    date: normalizeText(row.date || row.日期),
    product,
    direction,
    status,
    contracts,
    entryPrice,
    exitPrice,
    pointValue,
    fee,
    tax,
    realizedPnl: realizedRaw === "" || realizedRaw === undefined ? calculatedPnl : toNumber(realizedRaw),
    note: normalizeText(row.note || row.備註 || row.strategy || row.策略),
  };
}

function calculateRealizedPnl(trade) {
  if (trade.exitPrice === "" || trade.status === "未平倉") return 0;
  const priceDiff = trade.direction === "空"
    ? trade.entryPrice - trade.exitPrice
    : trade.exitPrice - trade.entryPrice;
  return priceDiff * trade.pointValue * trade.contracts - trade.fee - trade.tax;
}

async function loadTrades() {
  const notice = document.getElementById("setupNotice");

  if (!GOOGLE_SHEET_CSV_URL) {
    notice.style.display = "block";
    return SAMPLE_TRADES;
  }

  notice.style.display = "none";
  const response = await fetch(GOOGLE_SHEET_CSV_URL);
  if (!response.ok) {
    throw new Error("讀取 Google Sheets 失敗，請確認 CSV 網址是否正確或是否已發布到網路。");
  }

  const csvText = await response.text();
  const parsed = parseCsv(csvText).map(normalizeTrade);
  return parsed;
}

function getClosedTrades() {
  return trades
    .filter((trade) => trade.status === "已平倉" || trade.exitPrice !== "")
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getOpenTrades() {
  return trades.filter((trade) => trade.status === "未平倉" || trade.exitPrice === "");
}

function summarizeOpenPositions(openTrades) {
  const groups = new Map();

  openTrades.forEach((trade) => {
    const key = `${trade.product}|${trade.direction}`;
    if (!groups.has(key)) {
      groups.set(key, {
        product: trade.product,
        direction: trade.direction,
        contracts: 0,
        totalCost: 0,
      });
    }
    const group = groups.get(key);
    group.contracts += trade.contracts;
    group.totalCost += trade.entryPrice * trade.contracts;
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    avgPrice: group.contracts ? group.totalCost / group.contracts : 0,
  }));
}

function renderDashboard() {
  const closedTrades = getClosedTrades();
  const openTrades = getOpenTrades();
  const openPositions = summarizeOpenPositions(openTrades);
  const totalRealizedPnl = closedTrades.reduce((sum, trade) => sum + toNumber(trade.realizedPnl), 0);
  const openContracts = openTrades.reduce((sum, trade) => sum + toNumber(trade.contracts), 0);

  document.getElementById("openPositionSummary").textContent = openPositions.length
    ? `${openPositions.length} 組持倉`
    : "無持倉";

  document.getElementById("openPositionDetail").textContent = openPositions.length
    ? openPositions.map((p) => `${p.product} ${p.direction} ${p.contracts} 口`).join("｜")
    : "目前沒有未平倉紀錄";

  document.getElementById("openContracts").textContent = `${formatNumber(openContracts)} 口`;

  const pnlEl = document.getElementById("totalRealizedPnl");
  pnlEl.textContent = formatCurrency(totalRealizedPnl);
  pnlEl.classList.toggle("positive", totalRealizedPnl >= 0);
  pnlEl.classList.toggle("negative", totalRealizedPnl < 0);

  document.getElementById("closedTradeCount").textContent = `${closedTrades.length} 筆`;

  const allocationA = totalRealizedPnl * ALLOCATION[0].ratio;
  const allocationB = totalRealizedPnl * ALLOCATION[1].ratio;
  document.getElementById("allocationA").textContent = formatCurrency(allocationA);
  document.getElementById("allocationB").textContent = formatCurrency(allocationB);

  renderOpenPositions(openPositions);
  renderPnlChart(closedTrades);
}

function renderOpenPositions(openPositions) {
  const body = document.getElementById("openPositionsBody");

  if (!openPositions.length) {
    body.innerHTML = `<tr><td colspan="4">目前沒有持倉</td></tr>`;
    return;
  }

  body.innerHTML = openPositions.map((position) => `
    <tr>
      <td data-label="商品">${position.product}</td>
      <td data-label="方向">${position.direction}</td>
      <td data-label="口數">${formatNumber(position.contracts)}</td>
      <td data-label="均價">${formatNumber(position.avgPrice.toFixed(0))}</td>
    </tr>
  `).join("");
}

function renderPnlChart(closedTrades) {
  const ctx = document.getElementById("pnlChart");
  const byDate = new Map();

  closedTrades.forEach((trade) => {
    byDate.set(trade.date, (byDate.get(trade.date) || 0) + toNumber(trade.realizedPnl));
  });

  let cumulative = 0;
  const labels = [];
  const data = [];

  Array.from(byDate.entries())
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .forEach(([date, pnl]) => {
      cumulative += pnl;
      labels.push(date);
      data.push(cumulative);
    });

  if (pnlChart) pnlChart.destroy();

  pnlChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "累積已實現損益",
        data,
        tension: 0.25,
        fill: false,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#e5e7eb" },
        },
        tooltip: {
          callbacks: {
            label: (context) => formatCurrency(context.raw),
          },
        },
      },
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: "#94a3b8", maxTicksLimit: window.innerWidth < 600 ? 4 : 8 },
          grid: { color: "rgba(148, 163, 184, 0.14)" },
        },
        y: {
          ticks: {
            color: "#94a3b8",
            callback: (value) => formatCurrency(value),
          },
          grid: { color: "rgba(148, 163, 184, 0.14)" },
        },
      },
    },
  });
}

function renderHistory(filteredTrades = null) {
  const body = document.getElementById("historyBody");
  const source = filteredTrades || [...trades]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 30);

  if (!source.length) {
    body.innerHTML = `<tr><td colspan="11">沒有符合條件的成交紀錄</td></tr>`;
    return;
  }

  body.innerHTML = source.map((trade) => {
    const pnlClass = toNumber(trade.realizedPnl) >= 0 ? "positive" : "negative";
    return `
      <tr>
        <td data-label="日期">${trade.date}</td>
        <td data-label="商品">${trade.product}</td>
        <td data-label="方向">${trade.direction}</td>
        <td data-label="狀態">${trade.status}</td>
        <td data-label="口數">${formatNumber(trade.contracts)}</td>
        <td data-label="進場">${formatNumber(trade.entryPrice)}</td>
        <td data-label="出場">${trade.exitPrice === "" ? "—" : formatNumber(trade.exitPrice)}</td>
        <td data-label="手續費">${formatCurrency(trade.fee)}</td>
        <td data-label="交易稅">${formatCurrency(trade.tax)}</td>
        <td data-label="損益" class="${trade.status === "已平倉" ? pnlClass : ""}">${trade.status === "已平倉" ? formatCurrency(trade.realizedPnl) : "—"}</td>
        <td data-label="備註">${trade.note || "—"}</td>
      </tr>
    `;
  }).join("");
}

function applyDateFilter() {
  const start = document.getElementById("startDate").value;
  const end = document.getElementById("endDate").value;

  const filtered = trades
    .filter((trade) => {
      if (start && trade.date < start) return false;
      if (end && trade.date > end) return false;
      return true;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  renderHistory(filtered);
}

function setupEvents() {
  document.querySelectorAll(".tab-btn").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach((btn) => btn.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((panel) => panel.classList.remove("active"));

      button.classList.add("active");
      document.getElementById(button.dataset.tab).classList.add("active");
    });
  });

  document.getElementById("applyFilterBtn").addEventListener("click", applyDateFilter);
  document.getElementById("resetFilterBtn").addEventListener("click", () => {
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    renderHistory();
  });

  document.getElementById("refreshBtn").addEventListener("click", init);
}

async function init() {
  try {
    const rawTrades = await loadTrades();
    trades = rawTrades.map(normalizeTrade).filter((trade) => trade.date && trade.product);
    renderDashboard();
    renderHistory();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

setupEvents();
init();
