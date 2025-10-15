import { Activity } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
        <Activity className="w-8 h-8 text-teal-600" />
        <h1 className="text-xl font-semibold text-gray-800">
          Rock Creek Wellness Assistant
        </h1>
      </div>
    </header>
  );
}
