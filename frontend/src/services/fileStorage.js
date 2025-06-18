import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../firebase/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const storage = getStorage();

const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target.result;
      if (!data || typeof data !== 'string') {
        reject(new Error('Invalid file data'));
      } else {
        resolve(data);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const saveIncidentFilesLocally = async (files) => {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        try {
          let dataUrl;
          
          // Check if the file already has a data URL in the url field
          if (file.url && file.url.startsWith('data:')) {
            dataUrl = file.url;
          } else if (file.path && file.path.startsWith('data:')) {
            dataUrl = file.path;
          } else {
            // Convert file to data URL if it doesn't have one
            dataUrl = await readFileAsDataURL(file.file || file);
          }
          
          if (!dataUrl || typeof dataUrl !== 'string') {
            throw new Error('Invalid file data');
          }
          
          return {
            path: dataUrl, // Store the data URL in path field for consistency
            url: dataUrl,  // Also store in url field for backward compatibility
            name: file.name,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
          };
        } catch (error) {
          console.error('Error processing file:', error);
          throw error;
        }
      })
    );

    console.log('Processed files:', processedFiles);
    return processedFiles;
  } catch (error) {
    console.error('Error saving files locally:', error);
    throw error;
  }
};

export const getLocalFile = async (path) => {
  if (!path || typeof path !== 'string') {
    console.error('Invalid file path:', path);
    return null;
  }
  return path; // Return the data URL directly
};

export const updateResponderLicense = async (responderId, file) => {
  try {
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `licenses/${uniqueFilename}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update the responder document with the new license information
    const responderRef = doc(db, 'responders', responderId);
    await updateDoc(responderRef, {
      licenseFiles: [{
        path: downloadURL,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }]
    });

    return downloadURL;
  } catch (error) {
    console.error('Error updating license:', error);
    throw new Error('Failed to update license. Please try again.');
  }
}; 