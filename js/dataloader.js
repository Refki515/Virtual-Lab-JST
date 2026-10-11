/* ============================================
   dataloader.js
   Parser CSV universal + deteksi kolom otomatis
   ============================================ */

class DataLoader {

    /* ---------- Parser CSV (mendukung tanda kutip) ---------- */
    static parseCSV(text) {
        const rows = [];
        let row = [];
        let field = '';
        let inQuotes = false;
        const delimiter = DataLoader._detectDelimiter(text);

        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            const next = text[i + 1];

            if (inQuotes) {
                if (c === '"' && next === '"') { field += '"'; i++; }
                else if (c === '"') { inQuotes = false; }
                else { field += c; }
            } else {
                if (c === '"') { inQuotes = true; }
                else if (c === delimiter) { row.push(field); field = ''; }
                else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
                else if (c === '\r') { /* skip */ }
                else { field += c; }
            }
        }
        if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }

        // Buang baris kosong
        return rows.filter(r => r.some(v => v.trim() !== ''));
    }

    static _detectDelimiter(text) {
        const sample = text.slice(0, 2000);
        const counts = {
            ',': (sample.match(/,/g) || []).length,
            ';': (sample.match(/;/g) || []).length,
            '\t': (sample.match(/\t/g) || []).length
        };
        let best = ',';
        let max = 0;
        for (const d in counts) {
            if (counts[d] > max) { max = counts[d]; best = d; }
        }
        return best;
    }

    /* ---------- Deteksi tipe kolom ---------- */
    static analyzeColumns(headers, rows) {
        const columns = [];
        for (let c = 0; c < headers.length; c++) {
            const values = rows.map(r => r[c]).filter(v => v !== undefined && v.trim() !== '');
            const numericCount = values.filter(v => DataLoader._isNumeric(v)).length;
            const uniqueVals = [...new Set(values.map(v => v.trim()))];
            const isNumeric = values.length > 0 && (numericCount / values.length) > 0.8;

            let type = 'numeric';
            if (!isNumeric) {
                type = uniqueVals.length <= 2 ? 'binary' : 'categorical';
            } else if (uniqueVals.length <= 2) {
                type = 'binary';
            }

            columns.push({
                index: c,
                name: headers[c],
                type: type,
                uniqueCount: uniqueVals.length,
                uniqueValues: uniqueVals.slice(0, 10),
                missing: rows.length - values.length
            });
        }
        return columns;
    }

    static _isNumeric(v) {
        if (v === undefined || v === null) return false;
        const t = String(v).trim();
        if (t === '') return false;
        return !isNaN(Number(t));
    }

    /* ---------- Konversi ke matriks numerik ---------- */
    static toMatrix(rows, headers) {
        return rows.map(r => {
            const obj = {};
            headers.forEach((h, i) => { obj[h] = r[i] !== undefined ? r[i].trim() : ''; });
            return obj;
        });
    }

    /* ---------- Encoding kolom kategorikal ---------- */
    static buildEncoders(headers, columns, data) {
        const encoders = {};
        for (const col of columns) {
            if (col.type === 'categorical' || col.type === 'binary') {
                const unique = [...new Set(data.map(r => r[col.name]))];
                const map = {};
                unique.forEach((v, i) => { map[v] = i; });
                encoders[col.name] = { map: map, reverse: unique };
            }
        }
        return encoders;
    }

    /* ---------- Normalisasi Min-Max ---------- */
    static computeNormParams(featureCols, columns, data) {
        const params = {};
        for (const name of featureCols) {
            const col = columns.find(c => c.name === name);
            if (col.type === 'numeric') {
                const vals = data.map(r => Number(r[name])).filter(v => !isNaN(v));
                const min = Math.min(...vals);
                const max = Math.max(...vals);
                params[name] = { min: min, max: max, range: (max - min) || 1 };
            }
        }
        return params;
    }

    static normalize(value, params) {
        if (!params) return value;
        return (value - params.min) / params.range;
    }

    /* ---------- Bangun vektor fitur ---------- */
    static buildFeatureVector(row, featureCols, columns, encoders, normParams) {
        const vec = [];
        for (const name of featureCols) {
            const col = columns.find(c => c.name === name);
            let raw = row[name];

            if (col.type === 'numeric') {
                let v = Number(raw);
                if (isNaN(v)) v = normParams[name] ? normParams[name].min : 0;
                vec.push(DataLoader.normalize(v, normParams[name]));
            } else if (col.type === 'binary') {
                // Binary: map ke 0/1
                const enc = encoders[name];
                if (enc) vec.push(enc.map[raw] !== undefined ? enc.map[raw] : 0);
                else vec.push(Number(raw) || 0);
            } else {
                // Kategorikal: one-hot sederhana -> rata-rata indeks ternormalisasi
                const enc = encoders[name];
                const idx = enc && enc.map[raw] !== undefined ? enc.map[raw] : 0;
                const total = enc ? enc.reverse.length : 1;
                vec.push(total > 1 ? idx / (total - 1) : 0);
            }
        }
        return vec;
    }

    /* ---------- Bangun target ---------- */
    static buildTarget(row, targetCol, columns, encoders) {
        const col = columns.find(c => c.name === targetCol);
        const raw = row[targetCol];
        if (col.type === 'numeric' || col.type === 'binary') {
            const num = Number(raw);
            if (!isNaN(num) && (num === 0 || num === 1)) return num;
            // binary tapi string (misal "Yes"/"No")
            const enc = encoders[targetCol];
            if (enc) return enc.map[raw] !== undefined ? enc.map[raw] : 0;
            return num >= 0.5 ? 1 : 0;
        }
        const enc = encoders[targetCol];
        return enc && enc.map[raw] !== undefined ? enc.map[raw] : 0;
    }

    /* ---------- Split data ---------- */
    static splitData(data, ratio) {
        const shuffled = data.slice();
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        const cut = Math.floor(shuffled.length * ratio);
        return {
            train: shuffled.slice(0, cut),
            test: shuffled.slice(cut)
        };
    }
}
