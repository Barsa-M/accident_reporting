import MediaDisplay from '../common/MediaDisplay';

const ForumPost = ({ post }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <img
            src={post.author.avatar || '/default-avatar.png'}
            alt={post.author.name}
            className="w-10 h-10 rounded-full"
          />
        </div>
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-[#0d522c]">{post.title}</h3>
            <span className="text-sm text-gray-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-600 mb-4">{post.content}</p>
          
          {post.attachments && post.attachments.length > 0 && (
            <div className="space-y-4">
              {post.attachments.map((url, index) => (
                <div key={index} className="max-w-2xl">
                  <MediaDisplay
                    url={url}
                    type="FORUM"
                    maxWidth="2xl"
                    maxHeight="96"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 hover:text-[#0d522c]">
                <FiThumbsUp className="h-4 w-4" />
                <span>{post.likes} Likes</span>
              </button>
              <button className="flex items-center space-x-1 hover:text-[#0d522c]">
                <FiMessageSquare className="h-4 w-4" />
                <span>{post.comments.length} Comments</span>
              </button>
            </div>
            <span>Posted by {post.author.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumPost; 