import { doc, collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const FORUM_CATEGORIES = {
  TRAFFIC_SAFETY: 'Traffic Safety',
  FIRE_SAFETY: 'Fire Safety',
  HEALTH_SAFETY: 'Health Safety',
  GENERAL: 'General Safety',
  EMERGENCY_TIPS: 'Emergency Tips'
};

export const POST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Create a new forum post
export const createForumPost = async (postData, userId) => {
  if (!postData.title || !postData.content || !postData.category) {
    throw new Error('Missing required post information');
  }

  if (!Object.values(FORUM_CATEGORIES).includes(postData.category)) {
    throw new Error('Invalid category');
  }

  const post = {
    ...postData,
    authorId: userId,
    status: POST_STATUS.APPROVED, // Auto-approve for now, can be changed to PENDING if moderation is needed
    createdAt: new Date(),
    updatedAt: new Date(),
    likes: 0,
    comments: []
  };

  const docRef = await addDoc(collection(db, 'forum_posts'), post);
  return docRef.id;
};

// Add a comment to a post
export const addComment = async (postId, comment, userId) => {
  if (!comment.content) {
    throw new Error('Comment content is required');
  }

  const postRef = doc(db, 'forum_posts', postId);
  const postDoc = await getDoc(postRef);

  if (!postDoc.exists()) {
    throw new Error('Post not found');
  }

  const newComment = {
    content: comment.content,
    authorId: userId,
    createdAt: new Date(),
    likes: 0
  };

  const currentComments = postDoc.data().comments || [];
  await updateDoc(postRef, {
    comments: [...currentComments, newComment],
    updatedAt: new Date()
  });
};

// Like/unlike a post
export const togglePostLike = async (postId, userId) => {
  const postRef = doc(db, 'forum_posts', postId);
  const likeRef = doc(db, 'post_likes', `${postId}_${userId}`);
  const likeDoc = await getDoc(likeRef);

  if (likeDoc.exists()) {
    // Unlike
    await deleteDoc(likeRef);
    await updateDoc(postRef, {
      likes: postDoc.data().likes - 1
    });
  } else {
    // Like
    await setDoc(likeRef, {
      userId,
      postId,
      createdAt: new Date()
    });
    await updateDoc(postRef, {
      likes: postDoc.data().likes + 1
    });
  }
};

// Get posts by category
export const getPostsByCategory = async (category) => {
  if (!Object.values(FORUM_CATEGORIES).includes(category)) {
    throw new Error('Invalid category');
  }

  const q = query(
    collection(db, 'forum_posts'),
    where('category', '==', category),
    where('status', '==', POST_STATUS.APPROVED)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get all posts (for admin moderation)
export const getAllPosts = async () => {
  const querySnapshot = await getDocs(collection(db, 'forum_posts'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Update post status (for moderation)
export const updatePostStatus = async (postId, newStatus, adminId) => {
  if (!Object.values(POST_STATUS).includes(newStatus)) {
    throw new Error('Invalid status');
  }

  const postRef = doc(db, 'forum_posts', postId);
  await updateDoc(postRef, {
    status: newStatus,
    moderatedBy: adminId,
    moderatedAt: new Date(),
    updatedAt: new Date()
  });
};

// Delete a post (admin only)
export const deletePost = async (postId) => {
  await deleteDoc(doc(db, 'forum_posts', postId));
}; 