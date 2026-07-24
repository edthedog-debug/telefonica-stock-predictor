class DataService {
  generateFallbackData() {
    const data = [];
    let price = 4.10;
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    for (let i = 0; i < 365; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const randomChange = (Math.random() - 0.49) * 0.08;
      price = Math.max(2.5, price + randomChange);
      
      data.push({
        date: d.toISOString().split('T')[0],
        close: parseFloat(price.toFixed(3)),
        open: parseFloat((price - randomChange * 0.5).toFixed(3)),
        high: parseFloat((price + Math.abs(randomChange)).toFixed(3)),
        low: parseFloat((price - Math.abs(randomChange)).toFixed(3)),
        volume: Math.floor(Math.random() * 5000000) + 1000000
      });
    }
    return data;
  }

  async loadHistoricalData() {
    const paths = [
      './data/sample-data.json',
      './data/predictions.json',
      'data/sample-data.json'
    ];

    for (const path of paths) {
      try {
        const response = await fetch(path);
        if (response.ok) {
          const json = await response.json();
          if (Array.isArray(json) && json.length > 0) return json;
          if (json.historical && Array.isArray(json.historical)) return json.historical;
          if (json.data && Array.isArray(json.data)) return json.data;
        }
      } catch (e) {
        // Continua al siguiente path o al fallback
      }
    }

    return this.generateFallbackData();
  }

  calculateBollingerBands(data, period = 20, stdDevMultiplier = 2) {
    return data.map((item, i) => {
      if (i < period - 1) {
        return { ...item, sma: null, upper: null, lower: null };
      }
      const slice = data.slice(i - period + 1, i + 1);
      const sum = slice.reduce((acc, curr) => acc + curr.close, 0);
      const sma = sum / period;

      const variance = slice.reduce((acc, curr) => acc + Math.pow(curr.close - sma, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      return {
        ...item,
        sma: parseFloat(sma.toFixed(3)),
        upper: parseFloat((sma + stdDev * stdDevMultiplier).toFixed(3)),
        lower: parseFloat((sma - stdDev * stdDevMultiplier).toFixed(3))
      };
    });
  }

  runMonteCarlo(lastPrice, days = 30, simulations = 1000) {
    const results = [];
    const volatility = 0.015;
    const drift = 0.0002;

    for (let s = 0; s < simulations; s++) {
      let current = lastPrice;
      const path = [current];
      for (let d = 0; d < days; d++) {
        const rand = (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.732; 
        current = current * Math.exp(drift + volatility * rand);
        path.push(parseFloat(current.toFixed(3)));
      }
      results.push(path);
    }

    const medianPath = [];
    const upperPath = [];
    const lowerPath = [];

    for (let d = 0; d <= days; d++) {
      const dayValues = results.map(r => r[d]).sort((a, b) => a - b);
      lowerPath.push(dayValues[Math.floor(simulations * 0.05)]);
      medianPath.push(dayValues[Math.floor(simulations * 0.50)]);
      upperPath.push(dayValues[Math.floor(simulations * 0.95)]);
    }

    return { medianPath, upperPath, lowerPath };
  }
}

window.dataService = new DataService();
