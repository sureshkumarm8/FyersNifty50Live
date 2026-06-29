// Shared session storage for serverless functions
// This allows multiple API endpoints to access the same data

const sessions = new Map();

export default sessions;
