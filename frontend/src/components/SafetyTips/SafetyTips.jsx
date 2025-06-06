import MediaDisplay from '../common/MediaDisplay';

const SafetyTipCard = ({ tip }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {tip.mediaFiles && tip.mediaFiles.length > 0 && (
        <div className="relative h-48">
          <MediaDisplay
            url={tip.mediaFiles[0]}
            type="SAFETY_TIP"
            maxWidth="full"
            maxHeight="48"
            showControls={false}
          />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-[#0d522c] mb-2">{tip.title}</h3>
        <p className="text-gray-600 mb-4">{tip.content}</p>
        {tip.mediaFiles && tip.mediaFiles.length > 1 && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            {tip.mediaFiles.slice(1).map((url, index) => (
              <div key={index} className="aspect-square">
                <MediaDisplay
                  url={url}
                  type="SAFETY_TIP"
                  maxWidth="full"
                  maxHeight="32"
                  showControls={false}
                />
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <span>Posted by {tip.author}</span>
          <span>{new Date(tip.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}; 