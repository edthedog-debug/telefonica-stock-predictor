# 📈 Telefónica Stock Predictor - Monte Carlo & Technical Analysis

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://edthedog-debug.github.io/telefonica-stock-predictor/)
[![Daily Update](https://img.shields.io/badge/Auto%20Update-Daily-blue?style=for-the-badge&logo=githubactions)](https://github.com/edthedog-debug/telefonica-stock-predictor/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Data: Real](https://img.shields.io/badge/Data-Google%20Finance%20REAL-red?style=for-the-badge)](https://www.google.com/finance/quote/TEF:BME)

---

## 🎯 What is this?

A **hybrid quantitative financial engineering dashboard** designed to analyze and predict **Telefónica (TEF.MC)** stock price movements using:

- 🎲 **Monte Carlo Simulation** (Geometric Brownian Motion with 95% Confidence Intervals)
- 📊 **Technical Analysis Indicators** (Bollinger Bands, SMA 20, MACD, RSI)
- 🎯 **Interactive Trend Indicator Gauge** (Real-time Bullish/Bearish sentiment)
- 🧪 **Quantitative Backtesting Engine** (Multivariate trade execution & logging)
- 🔄 **Automated Daily Market Updates** with real-time data integration.

---

## 🚀 Live Demo

### 👉 [https://edthedog-debug.github.io/telefonica-stock-predictor/](https://edthedog-debug.github.io/telefonica-stock-predictor/)

---

## ✨ Key Features

### Analytics & Forecasting
| Feature | Description |
|---------|-------------|
| 🎲 **Monte Carlo Forecast** | Projected future prices with upper (+95%) and lower (-95%) confidence error bands |
| 📈 **Trend Indicator (Gauge)** | Semicircular speedometer displaying real-time market sentiment based on drift analysis |
| 🔍 **Interactive Tooltips** | Hover/touch crosshair mode showing precise historical, projected, and technical values |

### Technical Indicators
| Feature | Description |
|---------|-------------|
| 📊 **Bollinger Bands** | 20-period moving average ($\pm2\sigma$) overlaid directly on the price series |
| 📈 **Moving Average (SMA 20)** | 20-period Simple Moving Average baseline |
| 📉 **Full MACD Oscillator** | Complete sub-chart rendering MACD Line, Signal Line (EMA 9), and Histogram |
| 📊 **RSI (14)** | Relative Strength Index integrated into the trading decision framework |

### Trading Signals & Decision Engine
| Signal | Condition | Operational Rule |
|--------|-----------|------------------|
| 🟢 **Bullish Trend / Buy** | Price $> \text{SMA}_{20}$ AND Monte Carlo Drift $> 0$ | Entry signal triggered |
| 🔴 **Bearish Trend / Sell** | Price $< \text{SMA}_{20}$ OR Monte Carlo Drift $< 0$ | Exit / Liquidation signal |
| 📊 **Real-time Diagnostic** | Dynamic single-card reading calculated instantly from the latest closing price | Real-time action recommendation |

### Quantitative Backtesting
| Feature | Description |
|---------|-------------|
| 🧪 **Historical Simulation** | Evaluates rule execution across the selected historical timeframe |
| 📋 **Trade Log** | Complete record of past entry dates, exit dates, entry prices, exit prices, and profit/loss |
| 📊 **Performance Metrics** | Calculates Total Trades, Win Rate %, and Cumulative Return % |

### Interface & Data Management
| Feature | Description |
|---------|-------------|
| 🔄 **Dynamic Range Selector** | Choose between 1M, 3M, 6M, 1Y, 5Y, or MAX; all indicators and simulations recalculate instantly |
| 📱 **Responsive Design** | Custom layout optimized for desktop, tablet, and mobile browsers |
| 🌐 **Localization** | Clean interface available in English |

---

## 🛠️ Architecture & Tech Stack

* **Frontend:** HTML5, CSS3, JavaScript (ES6+ Modules)
* **Visualization:** Chart.js (with custom canvas scaling and responsive aspect ratios)
* **Deployment & CI/CD:** GitHub Pages + GitHub Actions for automated daily sync

---

## 📄 License

This project is open-source and available under the **MIT License**.
