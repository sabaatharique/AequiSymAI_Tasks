import { useState } from 'react';

export default function VisitForm({
  isStaff,
  currentUserId,
  patients = [],
  preselectedPatientId = null,
  onSubmit,
  onCancel,
  loading = false,
  errors = {},
}) {
  const getInitialPatientId = () => {
    if (!isStaff) return currentUserId ? String(currentUserId) : '';
    if (preselectedPatientId) return String(preselectedPatientId);
    if (patients.length === 1) return String(patients[0].id);
    return '';
  };

  const getNowLocalDateTime = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
      now.getHours()
    )}:${pad(now.getMinutes())}`;
  };

  const [patientId, setPatientId] = useState(getInitialPatientId);
  const [doctorName, setDoctorName] = useState('');
  const [visitDate, setVisitDate] = useState(getNowLocalDateTime);
  const [clinicalNote, setClinicalNote] = useState('');
  const [clientDateError, setClientDateError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (new Date(visitDate) > new Date()) {
      setClientDateError('Visit date cannot be in the future.');
      return;
    }
    setClientDateError(null);

    const selectedId = isStaff ? Number(patientId) : Number(currentUserId);

    let formattedDate = visitDate;
    try {
      formattedDate = new Date(visitDate).toISOString();
    } catch {
      // fallback to input string
    }

    const payload = {
      patient: selectedId,
      doctor_name: doctorName.trim(),
      visit_date: formattedDate,
      clinical_note: clinicalNote.trim(),
    };

    onSubmit(payload);
  };


  const fieldErrors = errors.fields || {};
  const generalError = errors.general || null;

  return (
    <div className="card visit-form-card" id="visit-form-section">
      <div className="card-header">
        <div>
          <h3>Log Patient Visit</h3>
          <p className="section-description">
            Records a new clinical visit and updates visit count and last visit timestamp.
          </p>
        </div>
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
            disabled={loading}
          >
            Close
          </button>
        )}
      </div>

      {generalError && (
        <div className="alert alert-error" role="alert">
          {generalError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="patient-form">
        <div className="form-grid">
          {/* Patient Selection */}
          <div className="form-group">
            <label htmlFor="visit-patient">
              Patient <span className="required-star">*</span>
            </label>
            {isStaff ? (
              <select
                id="visit-patient"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                required
                disabled={loading}
              >
                <option value="">-- Select Patient --</option>
                {patients.map((p) => {
                  const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unnamed';
                  return (
                    <option key={p.id} value={p.id}>
                      #{p.id} - {name} ({p.mobile})
                    </option>
                  );
                })}
              </select>
            ) : (
              <input
                id="visit-patient"
                type="text"
                value={`You (Patient ID: #${currentUserId || 'Self'})`}
                disabled
              />
            )}
            {fieldErrors.patient && (
              <span className="field-error-text">{fieldErrors.patient}</span>
            )}
          </div>

          {/* Doctor Name */}
          <div className="form-group">
            <label htmlFor="visit-doctor">
              Doctor Name <span className="required-star">*</span>
            </label>
            <input
              id="visit-doctor"
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="e.g. Dr. Kashem Uddin"
              required
              disabled={loading}
            />
            {fieldErrors.doctor_name && (
              <span className="field-error-text">{fieldErrors.doctor_name}</span>
            )}
          </div>

          {/* Visit Date & Time */}
          <div className="form-group">
            <label htmlFor="visit-date">
              Visit Date & Time <span className="required-star">*</span>
            </label>
            <input
              id="visit-date"
              type="datetime-local"
              value={visitDate}
              max={getNowLocalDateTime()}
              onChange={(e) => {
                setVisitDate(e.target.value);
                setClientDateError(null);
              }}
              required
              disabled={loading}
            />
            {(clientDateError || fieldErrors.visit_date) && (
              <span className="field-error-text">
                {clientDateError || fieldErrors.visit_date}
              </span>
            )}
          </div>

          {/* Clinical Note */}
          <div className="form-group form-group-full">
            <label htmlFor="visit-note">Clinical Note</label>
            <textarea
              id="visit-note"
              rows="2"
              value={clinicalNote}
              onChange={(e) => setClinicalNote(e.target.value)}
              placeholder="e.g. Prescribed medication, follow-up in 2 weeks."
              disabled={loading}
            />
            {fieldErrors.clinical_note && (
              <span className="field-error-text">{fieldErrors.clinical_note}</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging Visit...' : 'Save Visit'}
          </button>
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
