/* ============================================
   algorithms.js
   Implementasi 4 Algoritma JST Supervised Learning
   ============================================ */

class MLAlgorithms {

    /* ---------- Fungsi Aktivasi ---------- */
    static step(x) {
        return x >= 0 ? 1 : 0;
    }

    static sign(x) {
        return x >= 0 ? 1 : -1;
    }

    static sigmoid(x) {
        return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
    }

    static sigmoidDerivative(output) {
        return output * (1 - output);
    }

    /* ============================================
       1. HEBB RULE
       W' = W + x * y  (pembelajaran asosiatif)
       ============================================ */
    static hebbRule(inputs, target, weights, bias, lr) {
        const n = inputs.length;
        let deltaW = new Array(n);
        let sum = bias;
        for (let i = 0; i < n; i++) sum += weights[i] * inputs[i];
        const output = MLAlgorithms.step(sum);
        const error = target - output;

        for (let i = 0; i < n; i++) {
            deltaW[i] = lr * inputs[i] * target;
        }

        return {
            weights: weights.map((w, i) => w + deltaW[i]),
            bias: bias + lr * target,
            deltaW: deltaW,
            output: output,
            error: error
        };
    }

    /* ============================================
       2. PERCEPTRON
       W' = W + lr * (target - output) * x
       ============================================ */
    static perceptron(inputs, target, weights, bias, lr) {
        const n = inputs.length;
        let sum = bias;
        for (let i = 0; i < n; i++) sum += weights[i] * inputs[i];

        const output = MLAlgorithms.step(sum);
        const error = target - output;

        let newBias = bias;
        const deltaW = new Array(n);
        const newWeights = new Array(n);

        for (let i = 0; i < n; i++) {
            deltaW[i] = lr * error * inputs[i];
            newWeights[i] = weights[i] + deltaW[i];
        }
        newBias += lr * error;

        return {
            weights: newWeights,
            bias: newBias,
            deltaW: deltaW,
            output: output,
            error: error
        };
    }

    /* ============================================
       3. DELTA RULE (LMS)
       W' = W + lr * (target - output) * x
       output = linear (sum)
       ============================================ */
    static deltaRule(inputs, target, weights, bias, lr) {
        const n = inputs.length;
        let sum = bias;
        for (let i = 0; i < n; i++) sum += weights[i] * inputs[i];

        const output = sum;
        const error = target - output;

        let newBias = bias;
        const deltaW = new Array(n);
        const newWeights = new Array(n);

        for (let i = 0; i < n; i++) {
            deltaW[i] = lr * error * inputs[i];
            newWeights[i] = weights[i] + deltaW[i];
        }
        newBias += lr * error;

        return {
            weights: newWeights,
            bias: newBias,
            deltaW: deltaW,
            output: output,
            error: error
        };
    }

    /* ============================================
       4. BACKPROPAGATION
       Arsitektur: Input -> Hidden (sigmoid) -> Output (sigmoid)
       ============================================ */
    static initBackprop(numInput, numHidden, numOutput, seed) {
        const rand = MLAlgorithms._seededRandom(seed);
        const wIH = [];
        for (let i = 0; i < numInput; i++) {
            wIH[i] = [];
            for (let h = 0; h < numHidden; h++) {
                wIH[i][h] = (rand() - 0.5) * 2;
            }
        }
        const bH = new Array(numHidden).fill(0);
        const wHO = [];
        for (let h = 0; h < numHidden; h++) {
            wHO[h] = [];
            for (let o = 0; o < numOutput; o++) {
                wHO[h][o] = (rand() - 0.5) * 2;
            }
        }
        const bO = new Array(numOutput).fill(0);
        return { wIH, bH, wHO, bO };
    }

    static backpropagation(inputs, targets, net, lr) {
        const numInput = inputs.length;
        const numHidden = net.bH.length;
        const numOutput = targets.length;

        // --- Forward pass ---
        const hiddenOut = new Array(numHidden);
        for (let h = 0; h < numHidden; h++) {
            let sum = net.bH[h];
            for (let i = 0; i < numInput; i++) sum += inputs[i] * net.wIH[i][h];
            hiddenOut[h] = MLAlgorithms.sigmoid(sum);
        }

        const finalOut = new Array(numOutput);
        for (let o = 0; o < numOutput; o++) {
            let sum = net.bO[o];
            for (let h = 0; h < numHidden; h++) sum += hiddenOut[h] * net.wHO[h][o];
            finalOut[o] = MLAlgorithms.sigmoid(sum);
        }

        // --- Backward pass ---
        const outputErrors = new Array(numOutput);
        const outputDeltas = new Array(numOutput);
        for (let o = 0; o < numOutput; o++) {
            outputErrors[o] = targets[o] - finalOut[o];
            outputDeltas[o] = outputErrors[o] * MLAlgorithms.sigmoidDerivative(finalOut[o]);
        }

        const hiddenDeltas = new Array(numHidden);
        for (let h = 0; h < numHidden; h++) {
            let sum = 0;
            for (let o = 0; o < numOutput; o++) {
                sum += outputDeltas[o] * net.wHO[h][o];
            }
            hiddenDeltas[h] = sum * MLAlgorithms.sigmoidDerivative(hiddenOut[h]);
        }

        // --- Update weights ---
        for (let h = 0; h < numHidden; h++) {
            for (let o = 0; o < numOutput; o++) {
                net.wHO[h][o] += lr * outputDeltas[o] * hiddenOut[h];
            }
        }
        for (let o = 0; o < numOutput; o++) {
            net.bO[o] += lr * outputDeltas[o];
        }
        for (let i = 0; i < numInput; i++) {
            for (let h = 0; h < numHidden; h++) {
                net.wIH[i][h] += lr * hiddenDeltas[h] * inputs[i];
            }
        }
        for (let h = 0; h < numHidden; h++) {
            net.bH[h] += lr * hiddenDeltas[h];
        }

        return {
            output: finalOut,
            error: outputErrors[0],
            hiddenOut: hiddenOut
        };
    }

    /* ---------- Prediksi (tanpa update) ---------- */
    static forwardBackprop(inputs, net) {
        const numHidden = net.bH.length;
        const numOutput = net.bO.length;
        const hiddenOut = new Array(numHidden);
        for (let h = 0; h < numHidden; h++) {
            let sum = net.bH[h];
            for (let i = 0; i < inputs.length; i++) sum += inputs[i] * net.wIH[i][h];
            hiddenOut[h] = MLAlgorithms.sigmoid(sum);
        }
        const finalOut = new Array(numOutput);
        for (let o = 0; o < numOutput; o++) {
            let sum = net.bO[o];
            for (let h = 0; h < numHidden; h++) sum += hiddenOut[h] * net.wHO[h][o];
            finalOut[o] = MLAlgorithms.sigmoid(sum);
        }
        return { output: finalOut, hiddenOut: hiddenOut };
    }

    /* ---------- Utilitas ---------- */
    static _seededRandom(seed) {
        let s = seed || 12345;
        return function () {
            s = (s * 1103515245 + 12345) & 0x7fffffff;
            return s / 0x7fffffff;
        };
    }
}
