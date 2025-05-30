import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

// Create a new post
export const createPost = async (postData, userId) => {
  try {
    // Upload image if exists
    let imageUrl = null;
    if (postData.image) {
      const imageRef = ref(storage, `posts/images/${Date.now()}_${postData.image.name}`);
      await uploadBytes(imageRef, postData.image);
      imageUrl = await getDownloadURL(imageRef);
    }

    // Upload video if exists
    let videoUrl = null;
    if (postData.video) {
      const videoRef = ref(storage, `posts/videos/${Date.now()}_${postData.video.name}`);
      await uploadBytes(videoRef, postData.video);
      videoUrl = await getDownloadURL(videoRef);
    }

    // Create post document
    const post = {
      title: postData.title,
      description: postData.description,
      imageUrl,
      videoUrl,
      authorId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      likes: 0,
      comments: []
    };

    const docRef = await addDoc(collection(db, 'forum_posts'), post);
    return { id: docRef.id, ...post };
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
};

// Get all posts
export const getAllPosts = async () => {
  try {
    const q = query(collection(db, 'forum_posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting posts:', error);
    throw error;
  }
};

// Get a single post
export const getPost = async (postId) => {
  try {
    const docRef = doc(db, 'forum_posts', postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting post:', error);
    throw error;
  }
};

// Update a post
export const updatePost = async (postId, postData) => {
  try {
    const postRef = doc(db, 'forum_posts', postId);
    await updateDoc(postRef, {
      ...postData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
};

// Delete a post
export const deletePost = async (postId) => {
  try {
    await deleteDoc(doc(db, 'forum_posts', postId));
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

// Add a comment to a post
export const addComment = async (postId, commentData) => {
  try {
    const postRef = doc(db, 'forum_posts', postId);
    const post = await getPost(postId);
    
    const newComment = {
      ...commentData,
      createdAt: serverTimestamp()
    };

    await updateDoc(postRef, {
      comments: [...(post.comments || []), newComment]
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Like a post
export const likePost = async (postId) => {
  try {
    const postRef = doc(db, 'forum_posts', postId);
    const post = await getPost(postId);
    
    await updateDoc(postRef, {
      likes: (post.likes || 0) + 1
    });
  } catch (error) {
    console.error('Error liking post:', error);
    throw error;
  }
}; 