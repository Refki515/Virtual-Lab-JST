/* ============================================
   visualizer.js
   Canvas network diagram + Chart.js error graph
   Format mengikuti contoh & versi heart attack:
   - Non-backprop : X1, X2, ... -> Y (tanpa hidden)
   - Backprop     : X -> H -> Y
   Garis hijau = bobot positif | merah = bobot negatif
   ============================================ */

class Visualizer {
    constructor(canvasId, chartId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.chartContainer = document.getElementById(chartId);
        this.chart = null;
        this.errorHistory = [];
        this.currentBias = 0;
    }

    /* ---------- Gambar jaringan di canvas ---------- */
    drawNetwork(config) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = '#f8f9fb';
        ctx.fillRect(0, 0, W, H);

        const inputLabels = config.inputLabels || [];
        const hiddenCount = config.hiddenCount || 0;
        const outputLabel = config.outputLabel || 'Y';
        const weights = config.weights || [];
        const net = config.net || null;
        const algo = config.algo || '';
        const useHidden = (algo === 'backpropagation' && net);

        // Judul
        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('Arsitektur Jaringan Syaraf Tiruan', W / 2, 20);

        const inputCount = inputLabels.length || weights.length || 1;
        const displayCount = Math.min(inputCount, 6);

        const centerY = H / 2 + 12;
        const inputX = 70;
        const outputX = W - 70;
        const hiddenX = W / 2;

        // Posisi node input
        const spacing = displayCount > 1 ? Math.min(50, (H - 90) / (displayCount - 1)) : 0;
        const startY = centerY - (spacing * (displayCount - 1)) / 2;
        const inputNodes = [];
        for (let i = 0; i < displayCount; i++) {
            const y = displayCount === 1 ? centerY : startY + i * spacing;
            inputNodes.push({ x: inputX, y });
        }
        const outputNode = { x: outputX, y: centerY };

        if (useHidden) {
            // ---------- 3 layer: input -> hidden -> output ----------
            const hCount = Math.min(hiddenCount, 8);
            const hSpacing = hCount > 1 ? Math.min(45, (H - 90) / (hCount - 1)) : 0;
            const hStartY = centerY - (hSpacing * (hCount - 1)) / 2;
            const hiddenNodes = [];
            for (let h = 0; h < hCount; h++) {
                const y = hCount === 1 ? centerY : hStartY + h * hSpacing;
                hiddenNodes.push({ x: hiddenX, y });
            }

            // Garis input -> hidden
            inputNodes.forEach((node, i) => {
                hiddenNodes.forEach((hn, h) => {
                    const w = (net.wIH[i] && net.wIH[i][h] !== undefined) ? net.wIH[i][h] : 0;
                    this.drawConnection(ctx, node, hn, w, false);
                });
            });
            // Garis hidden -> output
            hiddenNodes.forEach((hn, h) => {
                const w = (net.wHO[h] && net.wHO[h][0] !== undefined) ? net.wHO[h][0] : 0;
                this.drawConnection(ctx, hn, outputNode, w, false);
            });

            // Node
            inputNodes.forEach((n, i) =>
                this.drawNode(ctx, n.x, n.y, this.shortLabel(inputLabels[i] || `X${i + 1}`), '#ffffff', '#3b5998'));
            hiddenNodes.forEach((n, h) =>
                this.drawNode(ctx, n.x, n.y, `H${h + 1}`, '#eef2fb', '#6b83c4'));
            this.drawNode(ctx, outputNode.x, outputNode.y, outputLabel, '#3b5998', '#2d4373', true);

        } else {
            // ---------- 2 layer: X1, X2, ... -> Y (gaya contoh) ----------
            inputNodes.forEach((node, i) => {
                const w = weights[i] !== undefined ? weights[i] : 0;
                this.drawConnection(ctx, node, outputNode, w, true);
            });
            inputNodes.forEach((node, i) =>
                this.drawNode(ctx, node.x, node.y, this.shortLabel(inputLabels[i] || `X${i + 1}`), '#ffffff', '#3b5998'));
            this.drawNode(ctx, outputNode.x, outputNode.y, outputLabel, '#3b5998', '#2d4373', true);
        }

        // Indikator fitur tersembunyi
        if (inputCount > 6) {
            ctx.fillStyle = '#64748b';
            ctx.font = '600 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'alphabetic';
            ctx.fillText(`+${inputCount - 6} fitur lainnya`, inputX, H - 8);
        }

        // Indikator bias
        ctx.fillStyle = '#64748b';
        ctx.font = '500 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`bias = ${(this.currentBias || 0).toFixed(3)}`, W / 2, H - 8);
    }

    shortLabel(name) {
        if (!name) return 'X';
        const s = String(name).replace(/[^A-Za-z0-9]/g, '');
        return s.substring(0, 4).toUpperCase();
    }

    drawConnection(ctx, p1, p2, weight, showLabel) {
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        const aw = Math.abs(weight);
        ctx.lineWidth = Math.min(Math.max(aw * 4, 1.5), 6);
        ctx.strokeStyle = weight >= 0 ? '#2e9e6a' : '#d9534f';
        ctx.globalAlpha = Math.min(Math.max(aw + 0.25, 0.35), 1);
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (showLabel) {
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            ctx.font = '600 9px monospace';
            const txt = weight.toFixed(2);
            const tw = ctx.measureText(txt).width;

            this.roundRect(ctx, midX - tw / 2 - 4, midY - 16, tw + 8, 14, 7);
            ctx.fillStyle = '#ffffff';
            ctx.fill();

            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(txt, midX, midY - 9);
        }
    }

    drawNode(ctx, x, y, label, fillColor = '#ffffff', borderColor = '#3b5998', isOutput = false) {
        const radius = isOutput ? 22 : 18;

        // Bayangan
        ctx.beginPath();
        ctx.arc(x, y + 2, radius, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fill();

        // Lingkaran node
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = borderColor;
        ctx.stroke();

        // Label
        ctx.fillStyle = isOutput ? '#ffffff' : borderColor;
        ctx.font = `700 ${isOutput ? 13 : 10}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
    }

    setBias(bias) {
        this.currentBias = bias;
    }

    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    /* ---------- Update error chart ---------- */
    initChart() {
        if (!this.chartContainer || typeof Chart === 'undefined') return;

        if (this.chart) {
            this.chart.destroy();
        }

        const ctx = this.chartContainer.getContext('2d');
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Error (MSE)',
                    data: [],
                    borderColor: '#3b5998',
                    backgroundColor: 'rgba(59, 89, 152, 0.08)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: 200 },
                scales: {
                    x: {
                        title: { display: true, text: 'Epoch' },
                        grid: { color: '#eef1f5' },
                        ticks: { color: '#94a3b8', font: { size: 10 }, maxTicksLimit: 8 }
                    },
                    y: {
                        title: { display: true, text: 'Error' },
                        beginAtZero: true,
                        grid: { color: '#eef1f5' },
                        ticks: { color: '#94a3b8', font: { size: 10 } }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1e293b',
                        titleFont: { size: 11 },
                        bodyFont: { size: 11 }
                    }
                }
            }
        });
        this.errorHistory = [];
    }

    addError(epoch, error) {
        if (!this.chart) return;
        const mse = Math.abs(error);
        this.errorHistory.push(mse);
        this.chart.data.labels.push(`Ep ${epoch}`);
        this.chart.data.datasets[0].data.push(mse);
        if (this.chart.data.labels.length > 200) {
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }
        this.chart.update('none');
    }

    clearChart() {
        this.errorHistory = [];
        if (this.chart) {
            this.chart.data.labels = [];
            this.chart.data.datasets[0].data = [];
            this.chart.update();
        }
    }

    clearCanvas() {
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    getAvgError() {
        if (this.errorHistory.length === 0) return 0;
        const sum = this.errorHistory.reduce((a, b) => a + b, 0);
        return sum / this.errorHistory.length;
    }

    getLastError() {
        return this.errorHistory.length > 0 ? this.errorHistory[this.errorHistory.length - 1] : 0;
    }
}
