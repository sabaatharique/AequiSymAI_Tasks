import { useState, Fragment } from 'react';

export default function PatientTable({
  patients = [],
  onEdit,
  onDelete,
  onLogVisit,
  isStaff = true,
  loading = false,
}) {
  const [expandedPatientId, setExpandedPatientId] = useState(null);

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const formatVisitTimestamp = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleRowClick = (patientId, e) => {
    // Ignore clicks on buttons or links inside the row
    if (e.target.closest('button') || e.target.closest('a')) {
      return;
    }
    setExpandedPatientId((prev) => (prev === patientId ? null : patientId));
  };

  return (
    <div className="table-responsive">
      <table className="patient-table">
        <thead>
          <tr>
            <th className="th-expand" aria-label="Expand"></th>
            <th>ID</th>
            <th>Name</th>
            <th>Mobile</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Blood Group</th>
            <th>Address</th>
            <th>Total Visits</th>
            <th>Last Visit</th>
            <th className="th-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && patients.length === 0 ? (
            <tr>
              <td colSpan="11" className="table-status-cell">
                Loading patients...
              </td>
            </tr>
          ) : patients.length === 0 ? (
            <tr>
              <td colSpan="11" className="table-status-cell">
                No patients found.
              </td>
            </tr>
          ) : (
            patients.map((patient) => {
              const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || '—';
              const isExpanded = expandedPatientId === patient.id;
              const visits = Array.isArray(patient.visits) ? patient.visits : [];

              return (
                <Fragment key={patient.id}>
                  <tr
                    className={`patient-row ${isExpanded ? 'row-expanded' : ''}`}
                    onClick={(e) => handleRowClick(patient.id, e)}
                    title="Click row to view patient visit history"
                  >
                    <td className="cell-expand">
                      <span className={`expand-chevron ${isExpanded ? 'chevron-down' : 'chevron-right'}`}>
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </td>
                    <td className="cell-id">#{patient.id}</td>
                    <td className="cell-name font-medium">{fullName}</td>
                    <td className="cell-mono">{patient.mobile || '—'}</td>
                    <td>{patient.age != null ? patient.age : '—'}</td>
                    <td>
                      <span className={`badge badge-gender badge-${String(patient.gender).toLowerCase()}`}>
                        {patient.gender || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-blood">{patient.blood_group || '—'}</span>
                    </td>
                    <td className="cell-address" title={patient.address || ''}>
                      {patient.address || '—'}
                    </td>
                    <td className="cell-center font-medium">{patient.total_visits ?? 0}</td>
                    <td className="cell-nowrap">{formatDateTime(patient.last_visit_date)}</td>
                    <td className="cell-actions" onClick={(e) => e.stopPropagation()}>
                      {onLogVisit && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success"
                          onClick={() => onLogVisit(patient)}
                          title="Log a visit for this patient"
                        >
                          Log Visit
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onEdit(patient)}
                        title="Update details"
                      >
                        Update
                      </button>
                      {isStaff && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => onDelete(patient)}
                          title="Delete this patient"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Dropdown Patient History Row */}
                  {isExpanded && (
                    <tr className="patient-history-row">
                      <td colSpan="11" className="patient-history-cell">
                        <div className="patient-history-container">
                          <div className="history-header">
                            <div className="history-title-group">
                              <h4 className="history-title">Clinical Visit History</h4>
                              <span className="history-subtitle">
                                Total Recorded Visits: <strong>{patient.total_visits ?? visits.length}</strong>
                              </span>
                            </div>
                          </div>

                          {visits.length === 0 ? (
                            <div className="history-empty">
                              <p>No recorded clinical visits for this patient yet.</p>
                              {onLogVisit && (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => onLogVisit(patient)}
                                >
                                  Log First Visit
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="history-table-wrapper">
                              <table className="history-subtable">
                                <thead>
                                  <tr>
                                    <th>#</th>
                                    <th>Visit Date & Time</th>
                                    <th>Attending Doctor</th>
                                    <th>Clinical Notes</th>
                                    <th>Recorded Timestamp</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {visits.map((visit, index) => (
                                    <tr key={visit.id || index}>
                                      <td className="cell-mono text-muted">{visit.id ? `#${visit.id}` : index + 1}</td>
                                      <td className="font-medium cell-nowrap">{formatVisitTimestamp(visit.visit_date)}</td>
                                      <td>{visit.doctor_name || '—'}</td>
                                      <td className="history-notes-cell">{visit.clinical_note || '—'}</td>
                                      <td className="cell-nowrap text-muted font-sm">{formatVisitTimestamp(visit.created_at)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
