"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Sidebar from "../components/Sidebar/Sidebar";
import { useDelayedReady } from "../hooks/useDelayedReady";
import { useAuthStatus } from "../hooks/useAuthStatus";
import LoadingOverlay from "../components/LoadingOverlay"; // We'll reuse its spinner only

interface ParkingSpot {
  spot_id: number;
  available: boolean;
  reserved: boolean;
  error: boolean;
}

interface SpotsResponse {
  spots: ParkingSpot[];
  total: number;
}

const fetcher = (url: string) =>
  fetch(url, { cache: "no-store" }).then((res) => res.json());

const spotsPerPage = 12;

export default function Map() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [displayedTotalPages, setDisplayedTotalPages] = useState(1);

  const { user, isLoading, isAdmin } = useAuthStatus();

  // Wait until user/auth checks are done
  const isReady = useDelayedReady({
    delay: 1000,
    dependencies: [isLoading, user],
    condition: !isLoading && !!user,
  });

  // Pull in data + isValidating to detect background refresh
  const { data: spotsData, isValidating } = useSWR<SpotsResponse>(
    isReady
      ? `/api/parking-spot?page=${currentPage}&limit=${spotsPerPage}&sort=spot_id&order=asc`
      : null,
    fetcher,
    {
      keepPreviousData: true,
      refreshInterval: 15000, // Poll every 15 seconds
    }
  );

  useEffect(() => {
    if (spotsData?.total) {
      setDisplayedTotalPages(Math.ceil(spotsData.total / spotsPerPage));
    }
  }, [spotsData?.total]);

  const spotDetail = (spotId: number) => {
    router.push(`/map/spot/${spotId}`);
  };

  // Determine spot label
  const getSpotLabel = (spot: ParkingSpot) => {
    if (spot.error) return "Error";
    if (spot.reserved) return "Reserved";
    if (spot.available) return "Available";
    return "Occupied";
  };

  // Determine label color for the spot status indicator
  const getStatusColor = (label: string) => {
    switch (label.toLowerCase()) {
      case "error":
        return "bg-yellow-600";
      case "reserved":
        return "bg-red-700";
      case "available":
        return "bg-emerald-700";
      default:
        return "bg-red-700";
    }
  };

  // If user/auth isn't ready, show full-page spinner
  if (!isReady) {
    return <LoadingOverlay />;
  }

  // Show spinner only on initial load (no data or total yet).
  // Remove extra logic so polling doesn't trigger spinner again.
  const initialLoadIncomplete = !spotsData || displayedTotalPages < 1;
  const isDataIncomplete = initialLoadIncomplete;

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 p-8 flex flex-col">
        {/* Header */}
        <header className="mb-4 flex-shrink-0">
          <h1 className="text-3xl font-bold text-gray-500">Parking Lot Map</h1>
        </header>

        {/* Main content wrapper */}
        <div className="bg-zinc-100 rounded-2xl shadow-md p-6 flex flex-col flex-grow">
          <div className="grid grid-cols-6 gap-6 flex-grow p-4">
            {isDataIncomplete ? (
              // Show small spinner ONLY on initial load
              <div className="flex-grow flex items-center justify-center col-span-6">
                <div className="w-12 h-12 border-4 border-zinc-200 border-t-zinc-500 rounded-full animate-spin" />
              </div>
            ) : (
              spotsData?.spots?.map((spot) => {
                const label = getSpotLabel(spot);
                return (
                  <div
                    key={spot.spot_id}
                    className="relative flex flex-col items-center justify-center border border-zinc-300 rounded-xl p-4 hover:scale-105 transition-transform duration-300 ease-in-out cursor-pointer"
                    onClick={() => {
                      if (isAdmin) {
                        spotDetail(spot.spot_id);
                      }
                    }}
                  >
                    <span className="text-lg text-zinc-500">
                      <span className="font-bold">PS</span>
                      <span className="font-medium">
                        {spot.spot_id.toString().padStart(3, "0")}
                      </span>
                    </span>
                    <span className="text-xs text-zinc-500 mt-0">{label}</span>
                    <div
                      className={`w-3 h-3 rounded-full mt-2 ${getStatusColor(
                        label
                      )}`}
                    />
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination + Legend (hidden only on *initial* load) */}
          {!initialLoadIncomplete && (
            <div className="flex justify-between items-center mt-4 p-2 bg-white rounded-lg shadow-md">
              <PaginationControls
                currentPage={currentPage}
                totalPages={displayedTotalPages}
                onPageChange={setCurrentPage}
              />
              <StatusLegend />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControls = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, i) => i + Math.max(1, Math.min(currentPage - 2, totalPages - 4))
  );

  return (
    <div className="flex justify-center bg-white">
      <ul className="flex items-center justify-center gap-1">
        {/* Previous button */}
        <li>
          <button
            id="prev-button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`inline-flex h-8 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100
              ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span>
              <svg
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M11.325 14.825C11.175 14.825 11.025 14.775 10.925 14.65L5.27495 8.90002C5.04995 8.67502 5.04995 8.32503 5.27495 8.10002L10.925 2.35002C11.15 2.12502 11.5 2.12502 11.725 2.35002C11.95 2.57502 11.95 2.92502 11.725 3.15002L6.47495 8.50003L11.75 13.85C11.975 14.075 11.975 14.425 11.75 14.65C11.6 14.75 11.475 14.825 11.325 14.825Z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="max-sm:hidden">Previous</span>
          </button>
        </li>

        {/* Page number buttons */}
        {pageNumbers.map((pageNumber, index) => (
          <li key={index}>
            {pageNumber < 0 ? (
              <span className="flex h-10 min-w-10 items-center justify-center rounded-lg px-2 text-gray-600">
                ...
              </span>
            ) : (
              <button
                id={`page-button-${pageNumber}`}
                onClick={() => onPageChange(pageNumber)}
                className={`flex h-8 min-w-8 items-center justify-center text-sm rounded-lg px-2 
                  ${
                    currentPage === pageNumber
                      ? "bg-zinc-500 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-gray-100"
                  }`}
              >
                {pageNumber}
              </button>
            )}
          </li>
        ))}

        {/* Next button */}
        <li>
          <button
            id="next-button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={`inline-flex h-8 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100
              ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <span className="max-sm:hidden">Next</span>
            <span>
              <svg
                width="17"
                height="17"
                viewBox="0 0 17 17"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.67495 14.825C5.52495 14.825 5.39995 14.775 5.27495 14.675C5.04995 14.45 5.04995 14.1 5.27495 13.875L10.525 8.50003L5.27495 3.15002C5.04995 2.92502 5.04995 2.57502 5.27495 2.35002C5.49995 2.12502 5.84995 2.12502 6.07495 2.35002L11.725 8.10002C11.95 8.32503 11.95 8.67502 11.725 8.90002L6.07495 14.65C5.97495 14.75 5.82495 14.825 5.67495 14.825Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </button>
        </li>
      </ul>
    </div>
  );
};

const StatusLegend = () => (
  <div className="flex items-center justify-end gap-10 px-6">
    <LegendItem color="bg-emerald-700" label="Available" />
    <LegendItem color="bg-red-700" label="Occupied / Reserved" />
    <LegendItem color="bg-yellow-600" label="Error" />
  </div>
);

interface LegendItemProps {
  color: string;
  label: string;
}

const LegendItem = ({ color, label }: LegendItemProps) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-full ${color}`} />
    <span className="text-sm text-gray-600">{label}</span>
  </div>
);