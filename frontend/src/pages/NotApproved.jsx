import PropTypes from 'prop-types';

const NotApproved = ({ rejectionReason }) => {
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-red-100 rounded shadow text-center">
      <h2 className="text-2xl font-semibold mb-4 text-red-800">Application Rejected</h2>
      <p className="text-red-700">
        We regret to inform you that your application to become a SAFE responder was not approved.
      </p>
      {rejectionReason && (
        <p className="mt-4 text-red-700">
          <strong>Reason:</strong> {rejectionReason}
        </p>
      )}
      <p className="mt-6 text-red-700">
        If you believe this was a mistake or you have any questions, please contact the SAFE admin.
      </p>
    </div>
  );
};

export default NotApproved;
