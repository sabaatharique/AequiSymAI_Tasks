export const extractErrors = (error) => {
  if (!error) {
    return { general: null, fields: {} };
  }

  // Network error or backend unreachable / CORS blocked
  if (!error.response) {
    return {
      general: 'Cannot reach the server. Is the backend running?',
      fields: {},
    };
  }

  const { status, data, config } = error.response;
  const url = config?.url || '';

  // Auth failure on login
  if (status === 401) {
    if (url.includes('/token/')) {
      return {
        general: 'Invalid mobile number or password.',
        fields: {},
      };
    }
    return {
      general: 'Session expired or unauthorized. Please log in again.',
      fields: {},
    };
  }

  // Not found
  if (status === 404) {
    return {
      general: 'Requested resource or page not found.',
      fields: {},
    };
  }

  // Validation errors (HTTP 400)
  if (status === 400 && data && typeof data === 'object') {
    const fields = {};
    let general = null;

    Object.entries(data).forEach(([key, value]) => {
      const message = Array.isArray(value) ? value.join(' ') : String(value);

      if (key === 'detail' || key === 'non_field_errors') {
        general = message;
      } else {
        fields[key] = message;
      }
    });

    if (!general && Object.keys(fields).length === 0) {
      general = 'Bad request. Please check the submitted data.';
    }

    return { general, fields };
  }

  // Server error or other status
  if (data && typeof data === 'object' && data.detail) {
    return {
      general: data.detail,
      fields: {},
    };
  }

  return {
    general: `Something went wrong (status ${status}).`,
    fields: {},
  };
};

/**
 * Returns a single string error representation from an Axios error.
 */
export const getErrorMessage = (error) => {
  const { general, fields } = extractErrors(error);
  if (general) return general;
  const firstFieldKey = Object.keys(fields)[0];
  if (firstFieldKey) {
    return `${firstFieldKey}: ${fields[firstFieldKey]}`;
  }
  return 'An unexpected error occurred.';
};
