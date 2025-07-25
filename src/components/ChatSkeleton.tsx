export function ChatSkeleton() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="h-96 overflow-y-auto p-6 space-y-4">
          <div className="flex justify-end">
            <div className="w-2/3 h-12 bg-gray-200 rounded-2xl"></div>
          </div>
          <div className="flex justify-start">
            <div className="w-1/2 h-16 bg-gray-200 rounded-2xl"></div>
          </div>
          <div className="flex justify-end">
            <div className="w-1/3 h-8 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
        <div className="border-t border-gray-100 p-4">
          <div className="h-16 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}
