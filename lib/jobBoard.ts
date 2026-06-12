/**
 * Job Board Helper
 * 
 * Ensures production-safe usage of the Job Board API key.
 * This file should ONLY be imported in backend/server routes or server actions.
 */

export function getJobBoardApiKey(): string {
  const apiKey = process.env.JOB_BOARD_API_KEY;

  if (!apiKey) {
    throw new Error("Job Board API key is missing. Please configure it in environment variables.");
  }

  return apiKey;
}

/**
 * Example usage wrapper for fetching from the Job Board API
 */
export async function fetchFromJobBoard(endpoint: string, options: RequestInit = {}) {
  const apiKey = getJobBoardApiKey();
  
  const headers = {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(`https://api.example-job-board.com${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    // Do NOT log the API key in the error message
    console.error(`Job Board API Error: ${response.status} ${response.statusText}`, errorText);
    throw new Error(`Job Board API Error: ${response.status}`);
  }

  return response.json();
}
