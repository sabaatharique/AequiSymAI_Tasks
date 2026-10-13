import { useState } from 'react';
import { GENDERS, BLOOD_GROUPS } from '../constants';

const initialFormState = {
  first_name: '',
  last_name: '',
  mobile: '',
  age: '',
  gender: 'MALE',
  blood_group: 'A+',
  address: '',
  password: '',
};

export default function PatientForm({
  editingPatient,
  onSubmit,
  onCancel,
  loading,
  errors = {},
}) {
  const isEditMode = Boolean(editingPatient);
  const [formData, setFormData] = useState(() => {
    if (editingPatient) {
      return {
        first_name: editingPatient.first_name || '',
        last_name: editingPatient.last_name || '',
        mobile: editingPatient.mobile || '',
        age: editingPatient.age != null ? String(editingPatient.age) : '',
        gender: editingPatient.gender || 'MALE',
        blood_group: editingPatient.blood_group || 'A+',
        address: editingPatient.address || '',
        password: '',
      };
    }
    return initialFormState;
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      mobile: formData.mobile.trim(),
      age: formData.age === '' ? null : Number(formData.age),
      gender: formData.gender,
      blood_group: formData.blood_group,
      address: formData.address.trim(),
    };

    if (isEditMode) {
      // In edit mode, only send password if user explicitly typed one
      if (formData.password.trim()) {
        payload.password = formData.password;
      }
    } else {
      // In add mode, password is required
      payload.password = formData.password;
    }

    onSubmit(payload);
  };

  const fieldErrors = errors.fields || {};
  const generalError = errors.general || null;

  return (
    <div className="card patient-form-card" id="patient-form-section">
      <div className="card-header">
        <h3>{isEditMode ? `Edit Patient (ID: ${editingPatient.id})` : 'Add New Patient'}</h3>
        {isEditMode && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel Edit
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
          {/* First Name */}
          <div className="form-group">
            <label htmlFor="field-first_name">
              First Name <span className="required-star">*</span>
            </label>
            <input
              id="field-first_name"
              name="first_name"
              type="text"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="e.g. Jarin"
              required
              disabled={loading}
            />
            {fieldErrors.first_name && (
              <span className="field-error-text">{fieldErrors.first_name}</span>
            )}
          </div>

          {/* Last Name */}
          <div className="form-group">
            <label htmlFor="field-last_name">Last Name</label>
            <input
              id="field-last_name"
              name="last_name"
              type="text"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="e.g. Tasnim (optional)"
              disabled={loading}
            />
            {fieldErrors.last_name && (
              <span className="field-error-text">{fieldErrors.last_name}</span>
            )}
          </div>

          {/* Mobile */}
          <div className="form-group">
            <label htmlFor="field-mobile">
              Mobile Number <span className="required-star">*</span>
            </label>
            <input
              id="field-mobile"
              name="mobile"
              type="tel"
              pattern="01[0-9]{9}"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="01XXXXXXXXX (11 digits)"
              required
              disabled={loading}
            />
            {fieldErrors.mobile && (
              <span className="field-error-text">{fieldErrors.mobile}</span>
            )}
          </div>

          {/* Age */}
          <div className="form-group">
            <label htmlFor="field-age">
              Age <span className="required-star">*</span>
            </label>
            <input
              id="field-age"
              name="age"
              type="number"
              min="0"
              max="150"
              value={formData.age}
              onChange={handleChange}
              placeholder="e.g. 35"
              required
              disabled={loading}
            />
            {fieldErrors.age && (
              <span className="field-error-text">{fieldErrors.age}</span>
            )}
          </div>

          {/* Gender */}
          <div className="form-group">
            <label htmlFor="field-gender">
              Gender <span className="required-star">*</span>
            </label>
            <select
              id="field-gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              required
              disabled={loading}
            >
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            {fieldErrors.gender && (
              <span className="field-error-text">{fieldErrors.gender}</span>
            )}
          </div>

          {/* Blood Group */}
          <div className="form-group">
            <label htmlFor="field-blood_group">
              Blood Group <span className="required-star">*</span>
            </label>
            <select
              id="field-blood_group"
              name="blood_group"
              value={formData.blood_group}
              onChange={handleChange}
              required
              disabled={loading}
            >
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
            {fieldErrors.blood_group && (
              <span className="field-error-text">{fieldErrors.blood_group}</span>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="field-password">
              Password {isEditMode ? '' : <span className="required-star">*</span>}
            </label>
            <input
              id="field-password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={isEditMode ? 'Leave blank to keep current' : 'Min 8 chars, not common'}
              required={!isEditMode}
              disabled={loading}
              autoComplete={isEditMode ? 'new-password' : 'current-password'}
            />
            {isEditMode && (
              <span className="field-hint-text">Leave blank to keep the current password.</span>
            )}
            {fieldErrors.password && (
              <span className="field-error-text">{fieldErrors.password}</span>
            )}
          </div>

          {/* Address */}
          <div className="form-group form-group-full">
            <label htmlFor="field-address">Address</label>
            <textarea
              id="field-address"
              name="address"
              rows="2"
              value={formData.address}
              onChange={handleChange}
              placeholder="e.g. 67/4 Motijheel, Dhaka (optional)"
              disabled={loading}
            />
            {fieldErrors.address && (
              <span className="field-error-text">{fieldErrors.address}</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading
              ? isEditMode
                ? 'Updating...'
                : 'Adding...'
              : isEditMode
                ? 'Update Patient'
                : 'Add Patient'}
          </button>
          {isEditMode && (
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
