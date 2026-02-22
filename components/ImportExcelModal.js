import React, { useState } from 'react';
import { X, FileSpreadsheet, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Grains', 'Snacks', 'Beverages', 'Other'];
const UNITS = ['pieces', 'kg', 'g', 'L', 'mL', 'cups', 'oz', 'lbs'];

function normalizeHeader(str) {
  if (typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/date$/i, 'date');
}

const HEADER_ALIASES = {
  name: ['name', 'item', 'product', 'ingredient'],
  quantity: ['quantity', 'qty', 'amount', 'qty'],
  unit: ['unit', 'units', 'uom'],
  category: ['category', 'type', 'cat'],
  expirationdate: ['expirationdate', 'expiry', 'expiration', 'expirydate', 'expdate', 'bestbefore'],
  notes: ['notes', 'note', 'comments', 'remarks'],
};

function mapRowToItem(row, headers) {
  const get = (key) => {
    const h = headers[key];
    if (h == null) return null;
    const v = row[h];
    if (v == null || v === '') return null;
    return String(v).trim();
  };
  const qty = get('quantity');
  const cat = get('category');
  const unit = get('unit');
  const exp = get('expirationdate');
  const unitLower = (unit || '').toLowerCase();
  const resolvedUnit = UNITS.includes(unitLower) ? unitLower : 'pieces';
  const resolvedCat = CATEGORIES.includes(cat) ? cat : (CATEGORIES.find((c) => c.toLowerCase() === (cat || '').toLowerCase()) || 'Other');
  return {
    name: get('name') || 'Unnamed',
    quantity: qty ? parseFloat(qty) || 1 : 1,
    unit: resolvedUnit,
    category: resolvedCat,
    expirationDate: exp || '',
    notes: get('notes') || '',
    addedDate: new Date().toISOString(),
    imageUrl: null,
  };
}

function detectHeaders(firstRow) {
  const keys = Object.keys(firstRow);
  const normalized = {};
  keys.forEach((k) => {
    const n = normalizeHeader(k);
    if (!n) return;
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((a) => n.includes(a) || n === a)) {
        normalized[field] = k;
        break;
      }
    }
    if (!Object.values(normalized).includes(k)) {
      if (n.includes('name') || n === 'item') normalized.name = k;
      else if (n.includes('qty') || n === 'quantity') normalized.quantity = k;
      else if (n === 'unit') normalized.unit = k;
      else if (n.includes('cat') || n === 'type') normalized.category = k;
      else if (n.includes('exp') || n.includes('date')) normalized.expirationdate = k;
      else if (n.includes('note')) normalized.notes = k;
    }
  });
  return normalized;
}

export default function ImportExcelModal({ isOpen, onClose, onAdd, onSaved }) {
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = (f.name || '').toLowerCase();
    if (!ext.endsWith('.xlsx') && !ext.endsWith('.xls')) {
      toast.error('Please choose an Excel file (.xlsx or .xls)');
      return;
    }
    setFile(f);
    setRows([]);
    setHeaders(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const first = wb.SheetNames[0];
        const sheet = wb.Sheets[first];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (json.length === 0) {
          toast.error('No rows found in the sheet');
          return;
        }
        const firstRow = json[0];
        const detected = detectHeaders(firstRow);
        if (!detected.name && Object.keys(firstRow).length > 0) {
          detected.name = Object.keys(firstRow)[0];
        }
        setHeaders(detected);
        setRows(json);
      } catch (err) {
        console.error(err);
        toast.error('Could not read Excel file');
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = async () => {
    if (!headers || rows.length === 0 || !db) return;
    setImporting(true);
    setProgress({ current: 0, total: rows.length });
    let done = 0;
    for (const row of rows) {
      const itemData = mapRowToItem(row, headers);
      const tempId = 'temp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
      const localItem = { ...itemData, id: tempId };
      onAdd(localItem);
      try {
        const docRef = await addDoc(collection(db, 'pantryItems'), itemData);
        if (onSaved) onSaved(tempId, docRef.id);
      } catch (e) {
        console.error(e);
        toast.error(`Failed to import "${itemData.name}"`);
      }
      done++;
      setProgress({ current: done, total: rows.length });
    }
    setImporting(false);
    toast.success(`Imported ${rows.length} item(s)`);
    onClose();
    setFile(null);
    setRows([]);
    setHeaders(null);
  };

  const handleClose = () => {
    if (!importing) {
      setFile(null);
      setRows([]);
      setHeaders(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  const previewRows = rows.slice(0, 10);
  const hasName = headers?.name != null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet size={24} />
            Import from Excel
          </h2>
          <button
            onClick={handleClose}
            disabled={importing}
            className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600 mb-3">
            Upload an .xlsx or .xls file. First row = headers. Supported columns: <strong>Name</strong> (required), Quantity, Unit (e.g. g, kg, pieces), Category (e.g. Vegetables, Fruits), Expiration/Expiry (date), Notes.
          </p>
          <label className="block">
            <span className="sr-only">Choose file</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={importing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-medium hover:file:bg-blue-100"
            />
          </label>

          {rows.length > 0 && (
            <>
              <p className="text-sm font-medium text-gray-700 mt-4 mb-2">
                Preview ({rows.length} row{rows.length !== 1 ? 's' : ''} found)
              </p>
              <div className="border border-gray-200 rounded-lg overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      {headers && Object.entries(headers).map(([field, col]) => (
                        <th key={field} className="px-3 py-2 text-left font-medium text-gray-700">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, idx) => (
                      <tr key={idx} className="border-b border-gray-100">
                        {headers && Object.values(headers).map((col) => (
                          <td key={col} className="px-3 py-2 text-gray-600">
                            {row[col] != null ? String(row[col]) : ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length > 10 && (
                <p className="text-xs text-gray-500 mt-1">… and {rows.length - 10} more</p>
              )}
            </>
          )}

          {file && rows.length > 0 && !hasName && (
            <p className="text-amber-600 text-sm mt-2">Could not detect a "Name" column. Using first column as name.</p>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500">
            {importing ? `Importing ${progress.current} of ${progress.total}…` : rows.length > 0 ? `Ready to import ${rows.length} item(s)` : ''}
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              disabled={importing}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={importing || rows.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {importing ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Importing…
                </>
              ) : (
                `Import ${rows.length} item(s)`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
