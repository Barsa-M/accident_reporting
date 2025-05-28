import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase/firebase";
import { notifyResponderStatusUpdate } from "../../firebase/notifications";

const ResponderApplicationDetail = ({ responder, onClose, onStatusUpdate }) => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!mapRef.current && responder.location) {
      // Initialize map
      mapRef.current = L.map('responder-location-map', {
        center: [responder.location.lat, responder.location.lng],
        zoom: 15,
        minZoom: 8,
        maxZoom: 18,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      // Add marker for responder location
      markerRef.current = L.marker([responder.location.lat, responder.location.lng])
        .addTo(mapRef.current)
        .bindPopup(responder.instituteName);

      // Set Ethiopia bounds
      const ethiopiaBounds = [
        [3.4, 33.0], // South-West
        [14.8, 48.0] // North-East
      ];
      mapRef.current.setMaxBounds(ethiopiaBounds);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [responder]);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      const approveResponder = httpsCallable(functions, "approveResponder");
      await approveResponder({ responderId: responder.id, action: "approved" });
      
      // Send notification
      await notifyResponderStatusUpdate(responder.id, "approved", responder);
      
      onStatusUpdate();
      onClose();
    } catch (error) {
      console.error("Error approving responder:", error);
      alert("Failed to approve responder. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }

    setIsProcessing(true);
    try {
      const approveResponder = httpsCallable(functions, "approveResponder");
      await approveResponder({
        responderId: responder.id,
        action: "rejected",
        rejectionReason
      });

      // Send notification
      await notifyResponderStatusUpdate(responder.id, "rejected", {
        ...responder,
        rejectionReason
      });

      onStatusUpdate();
      onClose();
    } catch (error) {
      console.error("Error rejecting responder:", error);
      alert("Failed to reject responder. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-[#0d522c]">Responder Application Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Basic Information */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="space-y-3">
                  <p><span className="font-medium">Institute Name:</span> {responder.instituteName}</p>
                  <p><span className="font-medium">Responder Type:</span> {responder.responderType}</p>
                  <p><span className="font-medium">Email:</span> {responder.email}</p>
                  <p><span className="font-medium">Phone:</span> {responder.phoneNumber}</p>
                  <p><span className="font-medium">Operating Hours:</span> {responder.operatingHours || "Not specified"}</p>
                  <p><span className="font-medium">Capacity:</span> {responder.capacity} staff</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Additional Details</h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {responder.additionalDetails || "No additional details provided."}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Application Timeline</h3>
                <p><span className="font-medium">Applied:</span> {responder.createdAt?.toDate().toLocaleString()}</p>
              </div>
            </div>

            {/* Right column - Map and Actions */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Location</h3>
                <div id="responder-location-map" className="h-[300px] rounded-lg border border-gray-300 mb-2"></div>
                <p className="text-sm text-gray-600">
                  Coordinates: {responder.location.lat}, {responder.location.lng}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                {!isRejecting ? (
                  <div className="flex gap-4">
                    <button
                      onClick={handleApprove}
                      disabled={isProcessing}
                      className={`flex-1 py-2 px-4 rounded transition-colors ${
                        isProcessing
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      {isProcessing ? "Processing..." : "Approve Application"}
                    </button>
                    <button
                      onClick={() => setIsRejecting(true)}
                      disabled={isProcessing}
                      className={`flex-1 py-2 px-4 rounded transition-colors ${
                        isProcessing
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700 text-white"
                      }`}
                    >
                      Reject Application
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a reason for rejection..."
                      className="w-full p-3 border rounded-lg"
                      rows={4}
                      disabled={isProcessing}
                    />
                    <div className="flex gap-4">
                      <button
                        onClick={() => setIsRejecting(false)}
                        disabled={isProcessing}
                        className={`flex-1 py-2 px-4 rounded transition-colors ${
                          isProcessing
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-gray-500 hover:bg-gray-600 text-white"
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleReject}
                        disabled={isProcessing}
                        className={`flex-1 py-2 px-4 rounded transition-colors ${
                          isProcessing
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-red-600 hover:bg-red-700 text-white"
                        }`}
                      >
                        {isProcessing ? "Processing..." : "Confirm Rejection"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponderApplicationDetail; 