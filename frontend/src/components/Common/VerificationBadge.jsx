import React from 'react';
import { FiShield, FiZap, FiHeart, FiCheckCircle } from 'react-icons/fi';
import PropTypes from 'prop-types';

const VerificationBadge = ({ responderType, size = 'default' }) => {
  const getBadgeConfig = (type) => {
    const configs = {
      police: {
        icon: <FiShield className="w-4 h-4" />,
        bgColor: 'bg-blue-500',
        borderColor: 'border-blue-600',
        textColor: 'text-blue-600'
      },
      fire: {
        icon: <FiZap className="w-4 h-4" />,
        bgColor: 'bg-red-500',
        borderColor: 'border-red-600',
        textColor: 'text-red-600'
      },
      medical: {
        icon: <FiHeart className="w-4 h-4" />,
        bgColor: 'bg-green-500',
        borderColor: 'border-green-600',
        textColor: 'text-green-600'
      },
      traffic: {
        icon: <FiShield className="w-4 h-4" />,
        bgColor: 'bg-yellow-500',
        borderColor: 'border-yellow-600',
        textColor: 'text-yellow-600'
      }
    };
    return configs[type.toLowerCase()] || configs.police;
  };

  const config = getBadgeConfig(responderType);

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    default: 'px-2 py-1 text-xs',
    large: 'px-3 py-1.5 text-sm'
  };

  return (
    <div className={`inline-flex items-center space-x-1 rounded-full border ${config.borderColor} ${config.bgColor} text-white font-semibold ${sizeClasses[size]}`}>
      {config.icon}
      <span className="capitalize">{responderType}</span>
      <FiCheckCircle className="w-3 h-3" />
    </div>
  );
};

VerificationBadge.propTypes = {
  responderType: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['small', 'default', 'large'])
};

export default VerificationBadge; 