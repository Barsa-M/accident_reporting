import React from 'react';
import { FiCheckCircle, FiXCircle, FiHome, FiAlertCircle } from 'react-icons/fi';

const SubmissionModal = ({ isOpen, type, message, onClose, onGoHome }) => {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-center ${isSuccess ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isSuccess ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {isSuccess ? (
              <FiCheckCircle className="w-8 h-8 text-green-600" />
            ) : (
              <FiXCircle className="w-8 h-8 text-red-600" />
            )}
          </div>
          <h3 className={`text-xl font-bold mb-2 ${
            isSuccess ? 'text-green-800' : 'text-red-800'
          }`}>
            {isSuccess ? 'Report Submitted Successfully!' : 'Submission Failed'}
          </h3>
          <p className={`text-sm ${
            isSuccess ? 'text-green-700' : 'text-red-700'
          }`}>
            {message}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {isSuccess && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <FiAlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What happens next?</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Your report has been sent to the appropriate responder</li>
                    <li>• You'll receive updates via notifications</li>
                    <li>• Emergency services will be dispatched if needed</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isError && (
            <div className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-start">
                <FiAlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">What you can do:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Check your internet connection</li>
                    <li>• Try submitting again in a few moments</li>
                    <li>• Contact support if the problem persists</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={onGoHome}
            className="flex-1 bg-[#0d522c] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0b421f] transition-colors flex items-center justify-center gap-2"
          >
            <FiHome className="w-4 h-4" />
            Go to Homepage
          </button>
          {isError && (
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionModal; 