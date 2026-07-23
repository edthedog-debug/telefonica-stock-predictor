/**
 * Simple Neural Network - Optimized
 * GitHub: edthedog-debug/telefonica-stock-predictor
 */
class NeuralNetwork {
    constructor() {
        this.weights1 = null;
        this.weights2 = null;
        this.trained = false;
        this.min = 0;
        this.max = 0;
    }

    train(prices, epochs = 300, learningRate = 0.01) {
        if (prices.length < 20) return false;

        this.min = Math.min(...prices);
        this.max = Math.max(...prices);
        const norm = prices.map(p => (p - this.min) / (this.max - this.min));

        const X = [], Y = [];
        for (let i = 5; i < norm.length; i++) {
            X.push([norm[i-5], norm[i-4], norm[i-3], norm[i-2], norm[i-1]]);
            Y.push(norm[i]);
        }

        // Simple weights: weighted average of last 5 days
        this.weights1 = [0.1, 0.15, 0.2, 0.25, 0.3];
        
        // Train: adjust weights to minimize error
        for (let epoch = 0; epoch < epochs; epoch++) {
            let totalError = 0;
            
            for (let i = 0; i < X.length; i++) {
                // Predict
                let pred = 0;
                for (let j = 0; j < 5; j++) pred += X[i][j] * this.weights1[j];
                
                // Error
                const error = Y[i] - pred;
                totalError += Math.abs(error);
                
                // Update weights
                for (let j = 0; j < 5; j++) {
                    this.weights1[j] += learningRate * error * X[i][j];
                }
            }
            
            // Normalize weights
            const sum = this.weights1.reduce((a, b) => a + b, 0);
            if (sum > 0) this.weights1 = this.weights1.map(w => w / sum);
        }

        this.trained = true;
        console.log('🧠 NN Trained. Weights:', this.weights1.map(w => w.toFixed(3)));
        return true;
    }

    predict(prices, days = 30) {
        if (!this.trained) return null;

        const norm = prices.map(p => (p - this.min) / (this.max - this.min));
        const predictions = [];
        let last5 = norm.slice(-5);

        for (let d = 0; d < days; d++) {
            let pred = 0;
            for (let j = 0; j < 5; j++) pred += last5[j] * this.weights1[j];
            
            const price = pred * (this.max - this.min) + this.min;
            predictions.push(price);
            
            last5.shift();
            last5.push(pred);
        }

        return predictions;
    }
}