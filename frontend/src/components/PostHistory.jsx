const PostHistory = () => {
    const posts = [
      { id: 1, image: "https://via.placeholder.com/150", title: "Accident on Highway" },
      { id: 2, image: "https://via.placeholder.com/150", title: "Car Breakdown" },
      { id: 3, image: "https://via.placeholder.com/150", title: "Traffic Congestion" },
      { id: 4, image: "https://via.placeholder.com/150", title: "Roadblock Warning" },
    ];
  
    return (
      <div className="p-4">
        <h2 className="text-lg font-semibold text-[#0D522C] mb-4">Post History</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-100 p-2 rounded-lg shadow-md">
              <img src={post.image} alt={post.title} className="w-full h-32 object-cover rounded-md" />
              <p className="text-sm text-center mt-2">{post.title}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default PostHistory;
  