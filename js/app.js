/* ============================================
   app.js
   App Controller - Upload, Config, Training, Testing
   ============================================ */

class AppController {
    constructor() {
        this.state = {
            // Data
            csvText: null,
            headers: [],
            rows: [],
            columns: [],
            data: [],
            encoders: {},
            normParams: {},
            
            // Split
            trainData: [],
            testData: [],
            
            // Config
            selectedAlgo: 'perceptron',
            featureCols: [],
            targetCol: null,
            trainingSplit: 0.8,
            
            // Hyperparameters
            lr: 0.1,
            threshold: 0.5,
            maxEpoch: 200,
            numHidden: 5,
            
            // State training
            isDataLoaded: false,
            isTraining: false,
            epoch: 0,
            error: 0,
            
            // Model
            weights: [],
            bias: 0,
            net: null, // untuk backprop
            
            // Log
            log: []
        };

        this.visualizer = null;
        this.init();
    }

    init() {
        // DOM elements
        this.uploadZone = document.getElementById('upload-zone');
        this.fileInput = document.getElementById('file-input');
        this.datasetInfo = document.getElementById('dataset-info');
        this.columnSelector = document.getElementById('column-selector');
        this.featureList = document.getElementById('feature-list');
        this.targetSelect = document.getElementById('target-select');
        this.algoSelect = document.getElementById('algo-select');
        this.lrInput = document.getElementById('lr-input');
        this.epochInput = document.getElementById('epoch-input');
        this.thresholdInput = document.getElementById('threshold-input');
        this.hiddenInput = document.getElementById('hidden-input');
        this.btnReset = document.getElementById('btn-reset');
        this.btnNextStep = document.getElementById('btn-nextstep');
        this.btnFastTrain = document.getElementById('btn-fasttrain');
        this.btnAutoRun = document.getElementById('btn-autorun');
        this.btnDownloadModel = document.getElementById('btn-download-model');
        this.statsContainer = document.getElementById('stats-container');
        this.networkCanvas = document.getElementById('network-canvas');
        this.errorChart = document.getElementById('error-chart');
        this.logConsole = document.getElementById('log-console');
        this.testInputs = document.getElementById('test-inputs');
        this.testResult = document.getElementById('test-result');
        this.btnPredict = document.getElementById('btn-predict');
        this.dataTable = document.getElementById('data-table');

        // Visualizer
        this.visualizer = new Visualizer('network-canvas', 'error-chart');

        // Event listeners
        this.setupEventListeners();
        this.updateUI();
    }

    setupEventListeners() {
        this.uploadZone.addEventListener('click', () => this.fileInput.click());
        this.uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadZone.classList.add('dragover');
        });
        this.uploadZone.addEventListener('dragleave', () => {
            this.uploadZone.classList.remove('dragover');
        });
        this.uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                this.handleFileSelect(e.dataTransfer.files[0]);
            }
        });

        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileSelect(e.target.files[0]);
            }
        });

        this.targetSelect.addEventListener('change', () => {
            this.state.targetCol = this.targetSelect.value;
            this.updateUI();
        });

        this.algoSelect.addEventListener('change', () => {
            this.state.selectedAlgo = this.algoSelect.value;
            this.updateUI();
        });

        this.lrInput.addEventListener('change', () => {
            this.state.lr = parseFloat(this.lrInput.value) || 0.1;
        });

        this.epochInput.addEventListener('change', () => {
            this.state.maxEpoch = parseInt(this.epochInput.value) || 200;
        });

        this.thresholdInput.addEventListener('change', () => {
            this.state.threshold = parseFloat(this.thresholdInput.value) || 0.5;
        });

        this.hiddenInput.addEventListener('change', () => {
            this.state.numHidden = parseInt(this.hiddenInput.value) || 5;
        });

        // Feature selector
        this.featureList.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.state.featureCols = Array.from(
                    document.querySelectorAll('#feature-list input[type="checkbox"]:checked')
                ).map(c => c.value);
                this.updateUI();
            }
        });

        this.btnReset.addEventListener('click', () => this.reset());
        this.btnNextStep.addEventListener('click', () => this.nextStep());
        this.btnFastTrain.addEventListener('click', () => this.fastTrain());
        this.btnAutoRun.addEventListener('click', () => this.autoRun());
        this.btnDownloadModel.addEventListener('click', () => this.downloadModel());
        this.btnPredict.addEventListener('click', () => this.predict());
    }

    /* ---------- File upload handler ---------- */
    handleFileSelect(file) {
        if (!file.name.endsWith('.csv')) {
            alert('Hanya file CSV yang didukung');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.state.csvText = e.target.result;
            this.loadData();
        };
        reader.readAsText(file);
    }

    /* ---------- Load data from CSV ---------- */
    loadData() {
        const rows = DataLoader.parseCSV(this.state.csvText);
        if (rows.length < 2) {
            alert('File CSV harus minimal 2 baris (header + data)');
            return;
        }

        this.state.headers = rows[0].map(h => h.trim());
        this.state.rows = rows.slice(1);
        this.state.columns = DataLoader.analyzeColumns(this.state.headers, this.state.rows);
        this.state.data = DataLoader.toMatrix(this.state.rows, this.state.headers);

        // Tampilkan info dataset dan status verifikasi
        if (this.datasetInfo) {
            this.datasetInfo.style.display = 'flex';
            this.datasetInfo.className = 'dataset-info active';
        }

        this.logAppend(`✓ Dataset terverifikasi: ${this.state.data.length} baris data, ${this.state.headers.length} kolom`);
        this.logAppend(`✓ Kolom terdeteksi: ${this.state.headers.join(', ')}`);

        this.state.isDataLoaded = true;
        this.renderColumnSelector();

        // Otomatis reset agar siap training langsung (Fast Train / Auto Run)
        this.reset();
        this.updateUI();
    }

    /* ---------- Render column selector ---------- */
    renderColumnSelector() {
        // JANGAN hapus container columnSelector — itu akan melepaskan targetSelect & featureList dari DOM
        // Target selector
        this.targetSelect.innerHTML = '<option value="">-- Pilih Target Kolom --</option>';
        this.state.columns.forEach(col => {
            const opt = document.createElement('option');
            opt.value = col.name;
            opt.textContent = `${col.name} (${col.type}, ${col.uniqueCount} unik)`;
            this.targetSelect.appendChild(opt);
        });
        // Auto-pilih target: kolom terakhir binary/categorical, atau kolom terakhir
        const autoTarget = this.state.columns.filter(c => c.type === 'binary').pop() || this.state.columns[this.state.columns.length - 1];
        if (autoTarget) {
            this.state.targetCol = autoTarget.name;
            this.targetSelect.value = autoTarget.name;
        }

        // Feature selector
        this.renderFeatureList();
    }

    renderFeatureList() {
        this.featureList.innerHTML = '';
        this.state.columns.forEach(col => {
            if (col.name === this.state.targetCol) return;
            const label = document.createElement('label');
            label.className = 'feature-item';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = col.name;
            // auto-centang semua fitur non-target (user bisa uncheck)
            checkbox.checked = true;
            const span = document.createElement('span');
            span.textContent = `${col.name} (${col.type})`;
            label.appendChild(checkbox);
            label.appendChild(span);
            this.featureList.appendChild(label);
        });
        // sync state
        this.state.featureCols = Array.from(
            document.querySelectorAll('#feature-list input[type="checkbox"]:checked')
        ).map(c => c.value);
    }

    /* ---------- Reset training ---------- */
    reset() {
        if (!this.state.isDataLoaded) {
            alert('Muat data terlebih dahulu');
            return;
        }

        if (!this.state.targetCol) {
            alert('Pilih target kolom');
            return;
        }

        if (this.state.featureCols.length < 2) {
            alert('Pilih minimal 2 fitur input');
            return;
        }

        // Build encoders
        this.state.encoders = DataLoader.buildEncoders(
            this.state.headers, this.state.columns, this.state.data
        );

        // Normalize numeric features
        this.state.normParams = DataLoader.computeNormParams(
            this.state.featureCols, this.state.columns, this.state.data
        );

        // Convert to vectors
        const vectors = this.state.data.map(row => ({
            x: DataLoader.buildFeatureVector(
                row, this.state.featureCols, this.state.columns,
                this.state.encoders, this.state.normParams
            ),
            y: DataLoader.buildTarget(row, this.state.targetCol, this.state.columns, this.state.encoders)
        }));

        // Split
        const split = DataLoader.splitData(vectors, this.state.trainingSplit);
        this.state.trainData = split.train;
        this.state.testData = split.test;

        // Init weights
        const numInput = this.state.featureCols.length;
        if (this.state.selectedAlgo === 'backpropagation') {
            this.state.net = MLAlgorithms.initBackprop(numInput, this.state.numHidden, 1, 42);
        } else {
            this.state.weights = new Array(numInput).fill(0);
            this.state.bias = 0;
        }

        this.state.epoch = 0;
        this.state.error = 0;
        this.visualizer.clearChart();
        this.visualizer.initChart();
        this.visualizer.setBias(this.state.bias || 0);
        this.redrawNetwork();

        this.state.log = [];
        this.logAppend(`✓ Reset berhasil. Model siap training.`);
        this.updateUI();
    }

    /* ---------- Gambar ulang jaringan dg bobot terkini ---------- */
    redrawNetwork() {
        if (!this.visualizer || !this.state.featureCols.length) return;
        if (this.state.selectedAlgo === 'backpropagation') {
            this.visualizer.drawNetwork({
                inputLabels: this.state.featureCols,
                hiddenCount: this.state.numHidden,
                outputLabel: 'Y',
                net: this.state.net,
                algo: 'backpropagation'
            });
        } else {
            this.visualizer.setBias(this.state.bias || 0);
            this.visualizer.drawNetwork({
                inputLabels: this.state.featureCols,
                outputLabel: 'Y',
                weights: this.state.weights || [],
                algo: this.state.selectedAlgo
            });
        }
    }

    /* ---------- Next step ---------- */
    nextStep() {
        if (this.state.epoch >= this.state.maxEpoch) {
            this.logAppend('⚠ Max epoch tercapai');
            return;
        }

        this.state.epoch++;
        const idx = Math.floor(Math.random() * this.state.trainData.length);
        const sample = this.state.trainData[idx];
        this.trainOneStep(sample);
        this.updateUI();
    }

    /* ---------- Train one step ---------- */
    trainOneStep(sample) {
        const { x, y } = sample;
        const algo = this.state.selectedAlgo;

        if (algo === 'backpropagation') {
            const result = MLAlgorithms.backpropagation(x, [y], this.state.net, this.state.lr);
            this.state.error = Math.abs(result.error);
        } else if (algo === 'perceptron') {
            const result = MLAlgorithms.perceptron(x, y, this.state.weights, this.state.bias, this.state.lr);
            this.state.weights = result.weights;
            this.state.bias = result.bias;
            this.state.error = Math.abs(result.error);
        } else if (algo === 'hebb') {
            const result = MLAlgorithms.hebbRule(x, y, this.state.weights, this.state.bias, this.state.lr);
            this.state.weights = result.weights;
            this.state.bias = result.bias;
        } else if (algo === 'delta') {
            const result = MLAlgorithms.deltaRule(x, y, this.state.weights, this.state.bias, this.state.lr);
            this.state.weights = result.weights;
            this.state.bias = result.bias;
            this.state.error = Math.abs(result.error);
        }

        this.visualizer.addError(this.state.epoch, this.state.error);
    }

    /* ---------- Fast train (auto loop) ---------- */
    fastTrain() {
        if (!this.state.isDataLoaded) {
            alert('Muat dataset terlebih dahulu');
            return;
        }
        if (!this.state.targetCol || this.state.featureCols.length < 2) {
            alert('Pilih target dan minimal 2 fitur');
            return;
        }
        if (this.state.epoch === 0) {
            this.reset();
        }
        if (this.state.trainData.length === 0) {
            alert('Data training kosong');
            return;
        }

        this.state.isTraining = true;
        this.logAppend(`▶ Training dimulai: ${this.state.selectedAlgo}, ${this.state.trainData.length} data, ${this.state.maxEpoch} epoch`);
        this.updateUI();

        const batchSize = 25;
        const loop = () => {
            if (this.state.epoch >= this.state.maxEpoch || !this.state.isTraining) {
                this.state.isTraining = false;
                this.logAppend(`✓ Training selesai pada epoch ${this.state.epoch}, error=${this.state.error.toFixed(6)}`);
                this.updateUI();
                return;
            }

            for (let i = 0; i < batchSize; i++) {
                if (this.state.epoch >= this.state.maxEpoch) break;
                this.state.epoch++;
                const idx = Math.floor(Math.random() * this.state.trainData.length);
                const sample = this.state.trainData[idx];
                this.trainOneStep(sample);
            }

            this.updateUI();

            // update UI lalu lanjut batch berikutnya
            if (this.state.isTraining) {
                setTimeout(loop, 20);
            }
        };

        loop();
    }

    /* ---------- Auto run (reset + train) ---------- */
    autoRun() {
        this.fastTrain();
    }

    /* ---------- Predict on test sample ---------- */
    predict() {
        const inputs = [];
        for (const col of this.state.featureCols) {
            const val = document.getElementById(`test-${col}`)?.value;
            if (val === undefined || val === '') {
                alert(`Isi input untuk ${col}`);
                return;
            }
            let v = parseFloat(val);
            if (isNaN(v)) v = 0;
            v = DataLoader.normalize(v, this.state.normParams[col]);
            inputs.push(v);
        }

        let output = 0;
        if (this.state.selectedAlgo === 'backpropagation') {
            const result = MLAlgorithms.forwardBackprop(inputs, this.state.net);
            output = result.output[0];
        } else {
            output = this.state.weights.reduce((s, w, i) => s + w * inputs[i], this.state.bias);
            if (this.state.selectedAlgo === 'perceptron' || this.state.selectedAlgo === 'hebb') {
                output = MLAlgorithms.step(output);
            } else {
                output = MLAlgorithms.sigmoid(output);
            }
        }

        const pred = output >= this.state.threshold ? 1 : 0;
        this.testResult.innerHTML = `
            <div class="test-result-box">
                <div class="test-result-label">Prediksi</div>
                <div class="test-result-value ${pred === 1 ? 'positive' : 'negative'}">
                    ${pred === 1 ? 'Positif' : 'Negatif'} (${output.toFixed(4)})
                </div>
            </div>
        `;
        this.logAppend(`→ Prediksi: ${pred === 1 ? 'Positif' : 'Negatif'} (${output.toFixed(4)})`);
    }

    /* ---------- Download model ---------- */
    downloadModel() {
        const model = {
            algo: this.state.selectedAlgo,
            featureCols: this.state.featureCols,
            targetCol: this.state.targetCol,
            weights: this.state.weights,
            bias: this.state.bias,
            net: this.state.net,
            lr: this.state.lr,
            threshold: this.state.threshold,
            normParams: this.state.normParams,
            encoders: this.state.encoders
        };
        const json = JSON.stringify(model, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'model_jst.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    /* ---------- Log helper ---------- */
    logAppend(msg) {
        const ts = new Date().toLocaleTimeString();
        this.state.log.push(`[${ts}] ${msg}`);
        if (this.logConsole) {
            this.logConsole.textContent = this.state.log.slice(-20).join('\n');
            this.logConsole.scrollTop = this.logConsole.scrollHeight;
        }
    }

    /* ---------- Update UI ---------- */
    updateUI() {
        const canTrain = this.state.isDataLoaded && this.state.targetCol && this.state.featureCols.length >= 2;
        const isTraining = this.state.epoch > 0;

        this.btnReset.disabled = !canTrain;
        this.btnNextStep.disabled = !isTraining || this.state.isTraining;
        // Fast Train & Auto Run: sama-sama auto-reset, bisa klik kapan saja
        this.btnFastTrain.disabled = !canTrain || this.state.isTraining;
        this.btnAutoRun.disabled = !canTrain || this.state.isTraining;
        this.btnPredict.disabled = !isTraining;

        // Stats
        if (this.statsContainer) {
            this.statsContainer.innerHTML = `
                <div class="stat-card">
                    <div class="stat-label">Status</div>
                    <div class="stat-value status-${this.state.epoch === 0 ? 'ready' : this.state.isTraining ? 'training' : 'done'}">
                        ${this.state.epoch === 0 ? 'Siap' : this.state.isTraining ? 'Training...' : 'Selesai'}
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Epoch</div>
                    <div class="stat-value epoch">${this.state.epoch}/${this.state.maxEpoch}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Error MSE</div>
                    <div class="stat-value error">${this.state.error.toFixed(6)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Dataset</div>
                    <div class="stat-value weights">${this.state.trainData.length} train / ${this.state.testData.length} test</div>
                </div>
            `;
        }

        // Test inputs
        if (this.testInputs && this.state.featureCols.length > 0) {
            const currentInputs = this.testInputs.querySelectorAll('input');
            if (currentInputs.length !== this.state.featureCols.length) {
                this.testInputs.innerHTML = '';
                this.state.featureCols.forEach(col => {
                    const div = document.createElement('div');
                    div.className = 'form-group';
                    div.innerHTML = `
                        <label class="form-label">${col}</label>
                        <input type="number" id="test-${col}" class="form-control" placeholder="Masukkan nilai" step="any">
                    `;
                    this.testInputs.appendChild(div);
                });
            }
        }

        // Dataset info
        if (this.datasetInfo && this.state.isDataLoaded) {
            this.datasetInfo.innerHTML = `
                <i class="fas fa-database"></i>
                <span><strong>${this.state.data.length}</strong> records | <strong>${this.state.headers.length}</strong> kolom</span>
            `;
        }

        // Redraw canvas jaringan
        this.redrawNetwork();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
});
