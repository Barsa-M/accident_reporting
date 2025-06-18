import React, { useState } from 'react';
import { FiChevronDown, FiCheck, FiX } from 'react-icons/fi';
import { AVAILABILITY_STATUS } from '../../firebase/responderStatus';
import { updateResponderAvailability, updateAvailabilityDirect } from '../../services/responderService';
import { useAuth } from '../../contexts/AuthContext';

/**
 * AvailabilityStatus Component
 * 
 * A reusable component that allows responders to update their availability status.
 * It provides a dropdown interface with three status options: Available, Busy, and Unavailable.
 * 
 * @param {Object} props - Component props
 * @param {string} props.currentStatus - Current availability status ('available', 'busy', 'unavailable')
 * @param {Function} props.onStatusChange - Callback function called when status changes
 * @param {boolean} props.disabled - Whether the component is disabled
 * @param {boolean} props.showLabel - Whether to show the current status label
 * @param {string} props.className - Additional CSS classes
 */
const AvailabilityStatus = ({ 
  currentStatus, 
  onStatusChange, 
  disabled = false,
  showLabel = true,
  className = "" 
}) => {
  const { currentUser } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true);
      setMessage({ type: '', text: '' });
      
      let result;
      
      // Try Firebase function first, fallback to direct update
      try {
        result = await updateResponderAvailability(newStatus);
      } catch (error) {
        console.warn('Firebase function failed, using direct update:', error);
        // Use direct update as fallback
        result = await updateAvailabilityDirect(currentUser.uid, newStatus);
      }
      
      // Update parent component
      if (onStatusChange) {
        const isAvailable = newStatus === AVAILABILITY_STATUS.AVAILABLE;
        onStatusChange(newStatus, isAvailable);
      }
      
      setIsDropdownOpen(false);
      
      // Show success message
      setMessage({ 
        type: 'success', 
        text: result.message || `Availability updated to ${newStatus}` 
      });
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 3000);
      
    } catch (error) {
      console.error('Error updating availability:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update availability status' 
      });
      
      // Clear error message after 5 seconds
      setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case AVAILABILITY_STATUS.AVAILABLE:
        return 'bg-green-100 text-green-800 border-green-200';
      case AVAILABILITY_STATUS.BUSY:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case AVAILABILITY_STATUS.UNAVAILABLE:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case AVAILABILITY_STATUS.AVAILABLE:
        return <FiCheck className="w-4 h-4" />;
      case AVAILABILITY_STATUS.BUSY:
        return <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse" />;
      case AVAILABILITY_STATUS.UNAVAILABLE:
        return <FiX className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case AVAILABILITY_STATUS.AVAILABLE:
        return 'Available for incidents';
      case AVAILABILITY_STATUS.BUSY:
        return 'Currently handling incidents';
      case AVAILABILITY_STATUS.UNAVAILABLE:
        return 'Not available for incidents';
      default:
        return 'Status unknown';
    }
  };

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      {/* Current Status Display */}
      {showLabel && (
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${getStatusColor(currentStatus)}`}>
          {getStatusIcon(currentStatus)}
          <span className="text-sm font-medium capitalize">
            {currentStatus}
          </span>
        </div>
      )}
      
      {/* Update Button */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={disabled || updating}
          className="flex items-center space-x-2 px-4 py-2 rounded-md bg-[#0D522C] text-white hover:bg-[#0a3d21] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{updating ? 'Updating...' : 'Update Availability'}</span>
          <FiChevronDown className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
            <div className="py-1" role="menu" aria-orientation="vertical">
              <div className="px-4 py-2 text-xs text-gray-500 border-b">
                Select your availability status:
              </div>
              
              <button
                onClick={() => handleStatusUpdate(AVAILABILITY_STATUS.AVAILABLE)}
                disabled={updating || currentStatus === AVAILABILITY_STATUS.AVAILABLE}
                className={`w-full text-left px-4 py-3 text-sm flex items-center space-x-3 ${
                  currentStatus === AVAILABILITY_STATUS.AVAILABLE
                    ? 'bg-[#0D522C] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                role="menuitem"
              >
                <FiCheck className="w-4 h-4" />
                <div className="flex flex-col">
                  <span className="font-medium">Available</span>
                  <span className="text-xs opacity-75">Ready to receive incidents</span>
                </div>
              </button>
              
              <button
                onClick={() => handleStatusUpdate(AVAILABILITY_STATUS.BUSY)}
                disabled={updating || currentStatus === AVAILABILITY_STATUS.BUSY}
                className={`w-full text-left px-4 py-3 text-sm flex items-center space-x-3 ${
                  currentStatus === AVAILABILITY_STATUS.BUSY
                    ? 'bg-[#0D522C] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                role="menuitem"
              >
                <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse" />
                <div className="flex flex-col">
                  <span className="font-medium">Busy</span>
                  <span className="text-xs opacity-75">Currently handling incidents</span>
                </div>
              </button>
              
              <button
                onClick={() => handleStatusUpdate(AVAILABILITY_STATUS.UNAVAILABLE)}
                disabled={updating || currentStatus === AVAILABILITY_STATUS.UNAVAILABLE}
                className={`w-full text-left px-4 py-3 text-sm flex items-center space-x-3 ${
                  currentStatus === AVAILABILITY_STATUS.UNAVAILABLE
                    ? 'bg-[#0D522C] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                role="menuitem"
              >
                <FiX className="w-4 h-4" />
                <div className="flex flex-col">
                  <span className="font-medium">Unavailable</span>
                  <span className="text-xs opacity-75">Not available for incidents</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Message Display */}
      {message.text && (
        <div className={`px-3 py-2 rounded-md text-sm ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
};

export default AvailabilityStatus; 