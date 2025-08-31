'use client';

import { useState, useEffect } from 'react';

// Admin page to verify database setup and view table contents
// This is a development tool to inspect the database schema

type TableName = 'users' | 'frames' | 'pixels' | 'frame_permissions' | 'frame_stats' | 'frame_likes' | 'frame_snapshots';

const TABLES: TableName[] = [
  'users',
  'frames', 
  'pixels',
  'frame_permissions',
  'frame_stats',
  'frame_likes',
  'frame_snapshots'
];

interface TableData {
  [key: string]: any[];
}

export default function AdminPage() {
  const [tableData, setTableData] = useState<TableData>({});
  const [selectedTable, setSelectedTable] = useState<TableName>('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTableData = async (tableName: TableName) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/tables/${tableName}?limit=50`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      setTableData(prev => ({
        ...prev,
        [tableName]: result.data || []
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const loadAllTables = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await Promise.all(
        TABLES.map(async (tableName) => {
          try {
            const response = await fetch(`/api/admin/tables/${tableName}?limit=10`);
            const result = await response.json();

            if (!response.ok) {
              console.error(`Error loading ${tableName}:`, result.error);
              return { tableName, data: [], error: result.error };
            }

            return { tableName, data: result.data || [], error: null };
          } catch (error) {
            console.error(`Error loading ${tableName}:`, error);
            return { tableName, data: [], error: 'Network error' };
          }
        })
      );

      const newTableData: TableData = {};
      results.forEach(({ tableName, data }) => {
        newTableData[tableName] = data;
      });

      setTableData(newTableData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllTables();
  }, []);

  const formatValue = (value: any): string => {
    if (value === null) return 'NULL';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'string' && value.length > 50) {
      return value.substring(0, 50) + '...';
    }
    return String(value);
  };

  const getTableColumns = (tableName: TableName): string[] => {
    const data = tableData[tableName];
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Database Admin Panel
          </h1>
          <p className="text-gray-600">
            Development tool to inspect the Gen Art Pixels database schema and data
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Error: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Table Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Tables</h2>
              <div className="space-y-2">
                {TABLES.map((tableName) => (
                  <button
                    key={tableName}
                    onClick={() => {
                      setSelectedTable(tableName);
                      loadTableData(tableName);
                    }}
                    className={`w-full text-left px-3 py-2 rounded transition-colors ${
                      selectedTable === tableName
                        ? 'bg-blue-100 text-blue-800'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{tableName}</span>
                      <span className="text-sm text-gray-500">
                        {tableData[tableName]?.length || 0}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              
              <button
                onClick={loadAllTables}
                disabled={loading}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Refresh All'}
              </button>
            </div>
          </div>

          {/* Table Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">
                    {selectedTable} ({tableData[selectedTable]?.length || 0} rows)
                  </h2>
                  <button
                    onClick={() => loadTableData(selectedTable)}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
              </div>

              <div className="p-6">
                {tableData[selectedTable] && tableData[selectedTable].length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {getTableColumns(selectedTable).map((column) => (
                            <th
                              key={column}
                              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                              {column}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {tableData[selectedTable].map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            {getTableColumns(selectedTable).map((column) => (
                              <td
                                key={column}
                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                              >
                                {formatValue(row[column])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {loading ? 'Loading...' : 'No data found'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Database Schema Overview */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Schema Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {TABLES.map((tableName) => (
              <div key={tableName} className="border border-gray-200 rounded p-4">
                <h3 className="font-medium text-gray-900 mb-2">{tableName}</h3>
                <div className="text-sm text-gray-600">
                  <p>Rows: {tableData[tableName]?.length || 0}</p>
                  <p>Columns: {getTableColumns(tableName).length}</p>
                </div>
                {getTableColumns(tableName).length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-1">Columns:</p>
                    <div className="text-xs text-gray-600 space-y-1">
                      {getTableColumns(tableName).slice(0, 5).map((col) => (
                        <div key={col} className="truncate">{col}</div>
                      ))}
                      {getTableColumns(tableName).length > 5 && (
                        <div className="text-gray-400">
                          +{getTableColumns(tableName).length - 5} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}