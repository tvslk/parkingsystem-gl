import Sidebar from "../Sidebar/Sidebar";
import InterfaceButton from "../Buttons/InterfaceButtons";
import { useRouter } from "next/navigation";

function formatCustomDateTime(dateString: string): string {
  const date = new Date(dateString);
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const formatSpotId = (id: number | string) =>
  "PS" + id.toString().padStart(3, "0");


interface AdminDashboardProps {
  counts: { available: number; occupied: number };
  visitsData: any[];
}

export default function AdminDashboard({ counts, visitsData }: AdminDashboardProps) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen bg-white">
    <Sidebar />
    <div className="flex-1 p-8 flex flex-col">
        <header className="mb-4 flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-500">Dashboard</h1>
        </header>

        <div className="flex-grow flex flex-col overflow-auto">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 flex-grow pb-8">
            {/* Available/Occupied Spots Card */}
            <div className="bg-zinc-100 rounded-2xl shadow-md p-6 lg:col-span-1">
              <div className="flex flex-col">
                <div className="text-6xl font-bold text-emerald-700 mb-2">
                  {counts.available}
                </div>
                <div className="text-gray-500 mb-4">
                  <span className="font-bold">available</span> parking spots
                </div>
                <div className="text-6xl font-bold text-red-700 mt-4">
                  {counts.occupied}
                </div>
                <div className="text-gray-500">
                  <span className="font-bold">occupied</span> parking spots
                </div>
              </div>
            </div>

            {/* Parking Lot Image Card */}
            <div className="bg-zinc-100 rounded-2xl shadow-md p-4 lg:col-span-2 flex flex-col h-full">
              <div className="flex-1 relative min-h-[300px]">
                <img
                  src="/map.png"
                  alt="Parking Lot"
                  className="rounded-lg absolute inset-0 w-full h-full object-cover"
                />
              </div>
                <div className="w-full flex justify-center mt-4">
                <InterfaceButton id="show-parking-lot" label="Show parking lot" onClick={() => router.push("/map")} />
                </div>
            </div>

            {/* Latest Updates Card - Admin View */}
            <div className="bg-zinc-100 rounded-2xl shadow-md p-6 lg:col-span-3">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold text-gray-500">Latest parking spot updates</h2>
                <InterfaceButton
                  id="view-all-visits"
                  onClick={() => router.push("/latest-visits")}
                  label="View all"
                />
              </div>
              <ul>
              {(visitsData?.length ?? 0) > 0 ? (
                visitsData.slice(0, 5).map((item: any, index: number) => (
                  <li
                    key={`${item.id || item.created_at}-${index}`}
                    className={`py-2 border-b text-gray-500 ${index === 0 ? "border-t" : ""}`}
                  >
                    {formatCustomDateTime(item.created_at)} - {formatSpotId(item.spot_id)} - {item.availability === 1 ? "Departed" : "Arrived"}
                  </li>
                ))
              ) : (
                <li className="py-2 text-gray-500">No data available.</li>
              )}
            </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}