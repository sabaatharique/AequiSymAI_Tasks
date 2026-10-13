import client from './client';

export const listPatients = async (page = 1, pageSize = 10, signal) => {
  const response = await client.get('/patients/', {
    params: {
      page,
      page_size: pageSize,
    },
    signal,
  });
  return response.data;
};

export const createPatient = async (patientData) => {
  const response = await client.post('/patients/', patientData);
  return response.data;
};

export const updatePatient = async (id, partialData) => {
  const response = await client.patch(`/patients/${id}/`, partialData);
  return response.data;
};

export const deletePatient = async (id) => {
  const response = await client.delete(`/patients/${id}/`);
  return response.data;
};

export const createVisit = async (visitData) => {
  const response = await client.post('/visits/', visitData);
  return response.data;
};

export const listVisits = async (patientId) => {
  const response = await client.get('/visits/', {
    params: patientId ? { patient: patientId } : {},
  });
  return response.data;
};


