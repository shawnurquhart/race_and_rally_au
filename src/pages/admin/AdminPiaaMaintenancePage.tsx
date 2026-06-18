import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import { backendSyncService, type BackendHealthStatus } from '@/services/backendSyncService';

type CheckStatus = 'unknown' | 'ok' | 'failed';

type CheckKey =
  | 'apiDb'
  | 'databaseConnected'
  | 'productsTable'
  | 'entriesTable'
  | 'referencesTable';

const CHECK_SEQUENCE: Array<{ key: CheckKey; label: string }> = [
  { key: 'apiDb', label: 'API/DB' },
  { key: 'databaseConnected', label: 'Database connected' },
  { key: 'productsTable', label: 'Table: products' },
  { key: 'entriesTable', label: 'Table: upload_register_entries' },
  { key: 'referencesTable', label: 'Table: upload_register_references' },
];

const UNKNOWN_STATUSES: Record<CheckKey, CheckStatus> = {
  apiDb: 'unknown',
  databaseConnected: 'unknown',
  productsTable: 'unknown',
  entriesTable: 'unknown',
  referencesTable: 'unknown',
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const AdminPiaaMaintenancePage: React.FC = () => {
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  const isDevelopmentRuntime = Boolean(import.meta.env.DEV) || isLocalHost;
  const usingRemoteApi = String(import.meta.env.VITE_USE_REMOTE_API ?? 'false') === 'true';
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const [health, setHealth] = useState<BackendHealthStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [showAutoChecking, setShowAutoChecking] = useState(false);
  const [checkStatuses, setCheckStatuses] = useState<Record<CheckKey, CheckStatus>>(UNKNOWN_STATUSES);

  const toStatuses = (result: BackendHealthStatus): Record<CheckKey, CheckStatus> => ({
    apiDb: result.ok ? 'ok' : 'failed',
    databaseConnected: result.database === 'connected' ? 'ok' : 'failed',
    productsTable: Boolean(result.tables?.products) ? 'ok' : 'failed',
    entriesTable: Boolean(result.tables?.upload_register_entries) ? 'ok' : 'failed',
    referencesTable: Boolean(result.tables?.upload_register_references) ? 'ok' : 'failed',
  });

  const applyStatusesStaggered = async (statuses: Record<CheckKey, CheckStatus>) => {
    const nextStatuses: Record<CheckKey, CheckStatus> = { ...UNKNOWN_STATUSES };

    for (const item of CHECK_SEQUENCE) {
      nextStatuses[item.key] = statuses[item.key];
      setCheckStatuses({ ...nextStatuses });
      await wait(500);
    }
  };

  const runHealthCheck = async ({ initial = false }: { initial?: boolean } = {}) => {
    setChecking(true);
    try {
      if (initial) {
        setHealth(null);
        setCheckStatuses(UNKNOWN_STATUSES);
        setShowAutoChecking(false);
        await wait(2000);
        setShowAutoChecking(true);
      }

      const result = await backendSyncService.health();
      setHealth(result);

      const statuses = toStatuses(result);
      if (initial) {
        await applyStatusesStaggered(statuses);
        setShowAutoChecking(false);
      } else {
        setCheckStatuses(statuses);
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    void runHealthCheck({ initial: true });
  }, []);

  const runInstall = async () => {
    setInstalling(true);
    try {
      await backendSyncService.install();
      await runHealthCheck();
    } finally {
      setInstalling(false);
    }
  };

  const cards = [
    {
      title: 'Spreadsheet Upload',
      description: 'Import section-based PIAA spreadsheets/CSVs (part number, description, units per package, retail).',
      to: '/admin/spreadsheet-upload',
      action: 'Open Spreadsheet Upload',
    },
    {
      title: 'Product Upload',
      description: 'Import product graphics and run image maintenance/repair tools.',
      to: '/admin/upload',
      action: 'Open Product Upload',
    },
    {
      title: 'Product Review',
      description: 'Review stored products, verify image matches, and remove incorrect entries.',
      to: '/admin/review',
      action: 'Open Product Review',
    },
    {
      title: 'Settings',
      description: 'Manage upload rules and storefront product display sizing defaults.',
      to: '/admin/settings',
      action: 'Open Settings',
    },
    {
      title: 'Traffic Reporting',
      description: 'View site visits with timestamp, page, IP and view duration, then export CSV/PDF or flush logs.',
      to: '/admin/traffic-reporting',
      action: 'Open Traffic Reporting',
    },
  ];

  const StatusItem: React.FC<{ label: string; status: CheckStatus }> = ({ label, status }) => (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex h-4 w-4 items-center justify-center rounded-sm text-[10px] font-bold ${
          status === 'ok'
            ? 'bg-emerald-600 text-white'
            : status === 'failed'
              ? 'bg-red-600 text-white'
              : 'bg-gray-600 text-gray-200'
        }`}
        aria-hidden="true"
      >
        {status === 'ok' ? '✓' : status === 'failed' ? '✕' : '•'}
      </span>
      <span>
        {label}:{' '}
        <span
          className={
            status === 'ok' ? 'text-emerald-400' : status === 'failed' ? 'text-red-400' : 'text-gray-400'
          }
        >
          {status === 'ok' ? 'OK' : status === 'failed' ? 'Failed' : 'Unknown'}
        </span>
      </span>
    </div>
  );

  return (
    <AdminLayout title="PIAA Products Display & Maintenance">
      <div className="border border-gray-800 bg-gray-950 p-5 mb-4">
        <p className="text-sm text-gray-300">
          Use this section to maintain PIAA catalog data and graphics workflows.
        </p>
      </div>

      <div className="border border-gray-800 bg-gray-950 p-5 mb-4">
        <h2 className="text-lg font-heading font-bold mb-2">Backend Sync Maintenance</h2>
        <div className="mb-3 border border-gray-800 bg-black/30 p-2.5 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-gray-400">Current Runtime:</span>
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold tracking-wide animate-pulse ${
                isDevelopmentRuntime
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isDevelopmentRuntime ? 'DEVELOPMENT' : 'PRODUCTION'}
            </span>
            <span
              className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-semibold border ${
                isOnline ? 'border-sky-500/40 text-sky-300 bg-sky-500/15' : 'border-red-500/40 text-red-300 bg-red-500/15'
              }`}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-300">{usingRemoteApi ? 'Remote API mode' : 'Local API mode'}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Checks cPanel API/database readiness for shared cross-browser data. If tables are missing, run install.
        </p>
        <div className="text-xs text-gray-300 border border-gray-800 bg-black/20 p-3">
          {showAutoChecking && (
            <div className="mb-3 flex items-center gap-2 text-[11px] text-gray-300">
              <span className="font-semibold">Auto checking now...</span>
              <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-gray-500 border-t-motorsport-yellow animate-spin" />
            </div>
          )}
          <div className="space-y-1">
            {CHECK_SEQUENCE.map((item) => (
              <StatusItem key={item.key} label={item.label} status={checkStatuses[item.key]} />
            ))}
          </div>
          {health?.error && <p className="text-amber-400 mt-2">Error: {health.error}</p>}
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={() => void runHealthCheck({ initial: true })}
            className="btn-secondary"
            disabled={checking}
          >
            {checking ? 'Checking...' : 'Check Backend Status'}
          </button>
          <button type="button" onClick={() => void runInstall()} className="btn-secondary" disabled={installing}>
            {installing ? 'Installing...' : 'Install/Repair DB Tables'}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <div key={card.title} className="border border-gray-800 bg-gray-900 p-5">
            <h2 className="text-xl font-heading font-bold mb-3">{card.title}</h2>
            <p className="text-gray-400 text-sm mb-5 min-h-20">{card.description}</p>

            <Link to={card.to} className="btn-primary inline-block text-sm">
              {card.action}
            </Link>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminPiaaMaintenancePage;
