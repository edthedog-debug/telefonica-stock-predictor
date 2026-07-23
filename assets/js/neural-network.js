/**
 * Simple Neural Network for Stock Prediction
 * GitHub: edthedog-debug/telefonica-stock-predictor
 * v3.0 - ML predictions vs Monte Carlo
 */
class NeuralNetwork {
    constructor() {
        this.weights = null;
        this.trained = false;
    }

    /**
     * Train a simple neural network on historical data
     * Uses: Last 5 days to predict next day
     */
    train(prices, epochs = 1000, learningRate = 0.001) {
        if (prices.length < 20) {
            console.warn('⚠️ Need at least 20 data points for training');
            return false;
        }

        // Normalize prices
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const normalized = prices.map(p => (p - min) / (max - min));

        // Prepare training data: use 5 days to predict day 6
        const X = [];
        const Y = [];
        
        for (let i = 5; i < normalized.length; i++) {
            X.push([
                normalized[i-5], normalized[i-4], normalized[i-3],
                normalized[i-2], normalized[i-1]
            ]);
            Y.push([normalized[i]]);
        }

        if (X.length < 5) {
            console.warn('⚠️ Not enough training samples');
            return false;
        }

        // Initialize weights (input:5, hidden:8, output:1)
        this.weights = {
            w1: this.randomMatrix(5, 8),
            b1: this.randomMatrix(1, 8),
            w2: this.randomMatrix(8, 1),
            b2: this.randomMatrix(1, 1)
        };

        // Training loop
        let bestLoss = Infinity;
        
        for (let epoch = 0; epoch < epochs; epoch++) {
            let totalLoss = 0;

            for (let i = 0; i < X.length; i++) {
                // Forward pass
                const hidden = this.sigmoid(this.add(
                    this.dot([X[i]], this.weights.w1),
                    this.weights.b1
                ));
                
                const output = this.add(
                    this.dot(hidden, this.weights.w2),
                    this.weights.b2
                );

                // Calculate loss
                const error = [[Y[i][0] - output[0][0]]];
                totalLoss += Math.abs(error[0][0]);

                // Backpropagation (simplified)
                const dOutput = [[-error[0][0]]];
                const dHidden = this.multiply(
                    this.dot(dOutput, this.transpose(this.weights.w2)),
                    this.sigmoidDerivative(hidden)
                );

                // Update weights
                this.weights.w2 = this.subtract(
                    this.weights.w2,
                    this.scale(this.dot(this.transpose(hidden), dOutput), learningRate)
                );
                this.weights.b2 = this.subtract(
                    this.weights.b2,
                    this.scale(dOutput, learningRate)
                );
                this.weights.w1 = this.subtract(
                    this.weights.w1,
                    this.scale(this.dot(this.transpose([X[i]]), dHidden), learningRate)
                );
                this.weights.b1 = this.subtract(
                    this.weights.b1,
                    this.scale(dHidden, learningRate)
                );
            }

            if (totalLoss < bestLoss) {
                bestLoss = totalLoss;
            }

            if (epoch % 200 === 0) {
                console.log('🧠 Epoch ' + epoch + ': loss = ' + totalLoss.toFixed(4));
            }
        }

        this.trained = true;
        this.min = min;
        this.max = max;
        console.log('✅ Neural network trained. Final loss: ' + bestLoss.toFixed(4));
        return true;
    }

    /**
     * Predict next N days
     */
    predict(prices, days = 30) {
        if (!this.trained || !this.weights) {
            console.warn('⚠️ Network not trained');
            return null;
        }

        const normalized = prices.map(p => (p - this.min) / (this.max - this.min));
        const predictions = [];
        let lastPrices = normalized.slice(-5);

        for (let d = 0; d < days; d++) {
            // Forward pass
            const hidden = this.sigmoid(this.add(
                this.dot([lastPrices], this.weights.w1),
                this.weights.b1
            ));
            
            const output = this.add(
                this.dot(hidden, this.weights.w2),
                this.weights.b2
            );

            const predictedNorm = output[0][0];
            const predictedPrice = predictedNorm * (this.max - this.min) + this.min;
            
            predictions.push(predictedPrice);

            // Update input for next prediction
            lastPrices.shift();
            lastPrices.push(predictedNorm);
        }

        return predictions;
    }

    // Matrix operations
    randomMatrix(rows, cols) {
        const m = [];
        for (let i = 0; i < rows; i++) {
            m[i] = [];
            for (let j = 0; j < cols; j++) {
                m[i][j] = (Math.random() * 2 - 1) * 0.1;
            }
        }
        return m;
    }

    sigmoid(x) {
        return x.map(row => row.map(v => 1 / (1 + Math.exp(-v))));
    }

    sigmoidDerivative(x) {
        return x.map(row => row.map(v => v * (1 - v)));
    }

    dot(a, b) {
        const result = [];
        for (let i = 0; i < a.length; i++) {
            result[i] = [];
            for (let j = 0; j < b[0].length; j++) {
                result[i][j] = 0;
                for (let k = 0; k < a[0].length; k++) {
                    result[i][j] += a[i][k] * b[k][j];
                }
            }
        }
        return result;
    }

    add(a, b) {
        return a.map((row, i) => row.map((v, j) => v + b[i][j]));
    }

    subtract(a, b) {
        return a.map((row, i) => row.map((v, j) => v - b[i][j]));
    }

    scale(a, scalar) {
        return a.map(row => row.map(v => v * scalar));
    }

    transpose(a) {
        const result = [];
        for (let j = 0; j < a[0].length; j++) {
            result[j] = [];
            for (let i = 0; i < a.length; i++) {
                result[j][i] = a[i][j];
            }
        }
        return result;
    }

    multiply(a, b) {
        return a.map((row, i) => row.map((v, j) => v * b[i][j]));
    }
}