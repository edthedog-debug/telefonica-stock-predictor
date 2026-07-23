# 📈 Telefónica Stock Predictor - Monte Carlo Simulation

[![GitHub Pages](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://edthedog-debug.github.io/telefonica-stock-predictor/)
[![Daily Update](https://img.shields.io/badge/Auto%20Update-Daily-blue?style=for-the-badge&logo=githubactions)](https://github.com/edthedog-debug/telefonica-stock-predictor/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)
[![Data: Real](https://img.shields.io/badge/Data-Google%20Finance%20REAL-red?style=for-the-badge)](https://www.google.com/finance/quote/TEF:BME)

---

## 🎯 What is this?

A **hybrid financial engineering model** for predicting **Telefónica (TEF.MC)** stock prices using:

- 🎲 **Monte Carlo Simulation** (Geometric Brownian Motion)
- 🤖 **Neural Network** (Machine Learning predictions)
- 📊 **Technical Analysis** (SMA, RSI, MACD, Bollinger Bands)
- 🧪 **Backtesting Engine** (Strategy performance validation)
- 🔄 **Automated Daily Updates** with REAL market data from Google Finance

---

## 🚀 Live Demo

### 👉 [https://edthedog-debug.github.io/telefonica-stock-predictor/](https://edthedog-debug.github.io/telefonica-stock-predictor/)

---

## ✨ Features

### Prediction Models
| Feature | Description |
|---------|-------------|
| 🎲 **Monte Carlo** | 1,000 simulations with 95% confidence intervals |
| 🤖 **Neural Network** | ML predictions compared side-by-side with Monte Carlo |
| 📈 **Consensus** | Combined MC + NN agreement signal |

### Technical Indicators
| Feature | Description |
|---------|-------------|
| 📊 **Bollinger Bands** | 20-period, 2σ bands overlaid on price chart |
| 📉 **MACD** | Full MACD chart (Line, Signal, Histogram) |
| 📋 **SMA** | 20 & 50 period Simple Moving Averages |
| 📊 **RSI** | 14-period Relative Strength Index |

### Trading Signals
| Signal | Condition | Action |
|--------|-----------|--------|
| 🟢 **Golden Cross** | SMA20 crosses above SMA50 | ENTRY |
| 🔴 **Death Cross** | SMA20 crosses below SMA50 | EXIT |
| 🟢 **RSI Oversold** | RSI(14) falls below 30 | ENTRY |
| 🔴 **RSI Overbought** | RSI(14) rises above 70 | EXIT |
| 🟢 **MACD Bullish Cross** | MACD line crosses above Signal line | ENTRY |
| 🔴 **MACD Bearish Cross** | MACD line crosses below Signal line | EXIT |
| 🟢 **Bollinger Lower** | Price touches Lower Band | ENTRY |
| 🔴 **Bollinger Upper** | Price touches Upper Band | EXIT |

### Dashboard Tools
| Feature | Description |
|---------|-------------|
| 📈 **Trend Gauge** | Bullish/Bearish speedometer (0-100%) |
| 🧪 **Backtesting** | Strategy simulation with €10,000 initial capital |
| 🔄 **Date Filter** | All indicators recalculate when changing date range |
| 📊 **Statistics** | Volatility, expected return, probability distribution |
| 📱 **Responsive** | Works on desktop, tablet, and mobile |

### Automation
| Feature | Description |
|---------|-------------|
| 🤖 **Daily Updates** | Auto-fetch real closing prices every trading day |
| 💾 **Real Data** | Historical data from Google Finance (2020-present) |

---

## 🛠️ Methodology

### Monte Carlo Model