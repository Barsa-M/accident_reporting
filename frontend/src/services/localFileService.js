// This is a mock local file service for web apps (browsers cannot write to disk directly)
// In a real desktop app, you would use Node.js or Electron APIs to save files to disk
// Here, we just keep files in memory and return their names as 'local paths'

const localFileStore = {};

export async function saveIncidentFilesLocally(files) {
  // Simulate saving files locally by storing them in a JS object
  const paths = [];
  for (const file of files) {
    const path = `localfiles/${Date.now()}_${file.name}`;
    localFileStore[path] = file;
    paths.push(path);
  }
  return paths;
}

export function getLocalFile(path) {
  return localFileStore[path];
} 