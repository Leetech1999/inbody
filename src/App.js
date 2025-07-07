import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Radar, Line } from "react-chartjs-2";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "./App.css";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  ChartDataLabels
);

const labels = ["몸무게", "내장지방지수", "체지방률", "기초대사량", "골격근량"];
const maxValues = [100, 20, 40, 2500, 60];
const normalize = (val, max) => (val / max) * 100;

const STORAGE_KEY = "inbody_records";

const FAKE_PAST_RECORDS = {
  "2023-06-27": [70.5, 11.2, 22.3, 1850, 33.1],
  "2023-06-28": [70.8, 11.0, 21.8, 1825, 32.9],
  "2023-06-29": [70.7, 10.8, 21.5, 1830, 32.5],
  "2023-06-30": [70.9, 10.9, 21.7, 1840, 32.7],
  "2023-07-01": [71.0, 11.1, 22.0, 1855, 33.0],
  "2023-07-02": [70.6, 10.7, 21.2, 1810, 32.2],
  "2023-07-03": [70.4, 10.6, 21.0, 1805, 32.0],
};

const getStoredTodayRecord = () => {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? JSON.parse(saved) : null;
};

const saveRecord = (date, data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date, data }));
};

function App() {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [todayData, setTodayData] = useState(["", "", "", "", ""]);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    const saved = getStoredTodayRecord();
    if (saved && saved.date === todayStr) {
      setTodayData(saved.data.map((index) => index.toString()));
    } else {
      setTodayData(["", "", "", "", ""]);
    }
  }, [todayStr]);

  const handleChange = (index, value) => {
    const newData = [...todayData];
    newData[index] = value;
    setTodayData(newData);
  };

  const [saveMsg, setSaveMsg] = useState("");
  const [fadeOut, setFadeOut] = useState(false);

  const handleSave = () => {
    saveRecord(todayStr, todayData);
    setSaveMsg("저장 완료!");
    setFadeOut(false);

    setTimeout(() => {
      setFadeOut(true);
    }, 1000);

    setTimeout(() => {
      setSaveMsg("");
      setFadeOut(false);
    }, 2000);
  };

  const allRecords = {
    ...FAKE_PAST_RECORDS,
    [todayStr]: todayData.map((i) => parseFloat(i) || 0),
  };

  const sortedDates = Object.keys(allRecords).sort();

  const lineChartData = {
    labels: sortedDates.map((dateStr) => {
      const date = new Date(dateStr);
      return `${("0" + (date.getMonth() + 1)).slice(-2)}/${(
        "0" + date.getDate()
      ).slice(-2)}`;
    }),
    datasets: [
      {
        label: labels[selectedTab],
        data: sortedDates.map((date) => {
          const record = allRecords[date] || [0, 0, 0, 0, 0];
          return record[selectedTab];
        }),
        fill: false,
        borderColor: "#FF8000",
        backgroundColor: "#FF8000",
        tension: 0,
        pointRadius: 4,
        pointHoverRadius: 5,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        beginAtZero: false,
        ticks: { font: { size: 10 }, color: "#666" },
        grid: { drawBorder: false, color: "#eee" },
      },
      x: {
        ticks: { font: { size: 10 }, color: "#666" },
        grid: { drawBorder: false, color: "#eee" },
      },
    },
  };

  const selectedData = allRecords[selectedDate] || [0, 0, 0, 0, 0];

  const radarData = {
    labels,
    datasets: [
      {
        label: "오늘",
        data: todayData.map((v, i) =>
          normalize(parseFloat(v) || 0, maxValues[i])
        ),
        backgroundColor: "rgba(255, 128, 0, 0.2)",
        borderColor: "#FF8000",
        pointBackgroundColor: "#FF8000",
        borderWidth: 2,
      },
      {
        label: `기록 (${selectedDate})`,
        data: selectedData.map((v, i) => normalize(v, maxValues[i])),
        backgroundColor: "rgba(140, 140, 140, 0.2)",
        borderColor: "#8C8C8C",
        pointBackgroundColor: "#8C8C8C",
        borderWidth: 2,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { display: true },
        suggestedMin: 0,
        suggestedMax: 100,
        pointLabels: { font: { size: 12 } },
        ticks: { display: false },
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            const datasetIndex = context.datasetIndex;
            const value =
              datasetIndex === 0
                ? parseFloat(todayData[index]) || 0
                : selectedData[index];
            return `${labels[index]}: ${value}`;
          },
        },
      },
      datalabels: {
        color: (ctx) => ctx.dataset.borderColor,
        font: { weight: "bold", size: 11 },
        formatter: (value, ctx) => {
          const index = ctx.dataIndex;
          return ctx.datasetIndex === 0
            ? parseFloat(todayData[index]) || 0
            : selectedData[index];
        },
        align: (ctx) => (ctx.datasetIndex === 0 ? "end" : "start"),
        anchor: (ctx) => (ctx.datasetIndex === 0 ? "end" : "start"),
        offset: (ctx) => (ctx.datasetIndex === 0 ? 8 : 14),
        clamp: true,
      },
    },
  };

  return (
    <div className="App">
      <h2>오늘의 인바디 입력</h2>

      {labels.map((label, i) => (
        <div className="input-row" key={i}>
          <label>{label}</label>
          <input
            type="number"
            value={todayData[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            step="any"
            min="0"
          />
        </div>
      ))}

      <button className="save-button" onClick={handleSave}>
        저장하기
      </button>

      {saveMsg && (
        <div className={`save-message ${fadeOut ? "fade-out" : ""}`}>
          {saveMsg}
        </div>
      )}

      <Swiper
        slidesPerView="auto"
        spaceBetween={8}
        freeMode
        style={{ paddingTop: 24, paddingBottom: 12 }}
      >
        {labels.map((label, index) => (
          <SwiperSlide key={index} style={{ width: "auto" }}>
            <button
              onClick={() => setSelectedTab(index)}
              className={`tab-button ${selectedTab === index ? "active" : ""}`}
            >
              {label}
            </button>
          </SwiperSlide>
        ))}
      </Swiper>

      <div style={{ width: "100%", height: 250, marginBottom: 24 }}>
        <Line data={lineChartData} options={lineChartOptions} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="select-label">비교 날짜 선택:</label>
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="select-date"
        >
          {sortedDates.map((date) => (
            <option key={date} value={date}>
              {date}
            </option>
          ))}
        </select>
      </div>

      <div style={{ width: "100%", height: 330 }}>
        <Radar
          data={radarData}
          options={radarOptions}
          plugins={[ChartDataLabels]}
        />
      </div>
    </div>
  );
}

export default App;
