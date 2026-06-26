"use client";

export type LeadFilterState = {
  search: string;
  status: string;
  sourceDomain: string;
  startDate: string;
  endDate: string;
  sortField: string;
  sortOrder: 'asc' | 'desc';
};

export function LeadFilters({
  value,
  onChange,
  onReset
}: {
  value: LeadFilterState;
  onChange: (next: LeadFilterState) => void;
  onReset: () => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
      <FilterInput label="Search" value={value.search} onChange={(search) => onChange({ ...value, search })} />
      <label className="space-y-1 text-sm text-slate-300">
        <span>Status</span>
        <select
          className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white"
          value={value.status}
          onChange={(event) => onChange({ ...value, status: event.target.value })}
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal">Proposal</option>
          <option value="won">Won</option>
          <option value="lost">Lost</option>
          <option value="deleted">Deleted</option>
        </select>
      </label>
      <FilterInput label="Source" value={value.sourceDomain} onChange={(sourceDomain) => onChange({ ...value, sourceDomain })} />
      <FilterInput label="Start Date" value={value.startDate} onChange={(startDate) => onChange({ ...value, startDate })} type="date" />
      <FilterInput label="End Date" value={value.endDate} onChange={(endDate) => onChange({ ...value, endDate })} type="date" />
      <div className="space-y-1 text-sm text-slate-300">
        <span>Sort</span>
        <select
          className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white"
          value={`${value.sortField}:${value.sortOrder}`}
          onChange={(event) => {
            const [sortField, sortOrder] = event.target.value.split(':');
            onChange({ ...value, sortField, sortOrder: sortOrder === 'asc' ? 'asc' : 'desc' });
          }}
        >
          <option value="createdAt:desc">Newest first</option>
          <option value="createdAt:asc">Oldest first</option>
          <option value="updatedAt:desc">Recently updated</option>
        </select>
      </div>
      <div className="flex items-end gap-3 md:col-span-2 xl:col-span-6">
        <button className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </div>
  );
}

function FilterInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  type?: 'text' | 'date';
  placeholder?: string;
}) {
  return (
    <label className="space-y-1 text-sm text-slate-300">
      <span>{label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2 text-white outline-none placeholder:text-slate-500"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
