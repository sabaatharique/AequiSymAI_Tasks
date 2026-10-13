import { useState, useEffect, useCallback, useRef } from 'react';
import {
  listPatients,
  createPatient,
  updatePatient,
  deletePatient,
  createVisit,
} from '../api/patients';
import { isStaffUser, getCurrentUserId } from '../api/auth';
import { extractErrors, getErrorMessage } from '../utils/errors';
import { DEFAULT_PAGE_SIZE } from '../constants';
import PatientForm from './PatientForm';
import PatientTable from './PatientTable';
import Pagination from './Pagination';
import VisitForm from './VisitForm';

export default function PatientsPage({ onLogout }) {
  const [isStaff, setIsStaff] = useState(() => isStaffUser());
  const [currentUserId, setCurrentUserId] = useState(() => getCurrentUserId());

  const [patients, setPatients] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Dropdown / Collapsible Form states
  const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);
  const [isVisitFormOpen, setIsVisitFormOpen] = useState(false);
  const [preselectedVisitPatientId, setPreselectedVisitPatientId] = useState(null);

  const [editingPatient, setEditingPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [visitSubmitting, setVisitSubmitting] = useState(false);

  const [pageError, setPageError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [formErrors, setFormErrors] = useState({ general: null, fields: {} });
  const [visitErrors, setVisitErrors] = useState({ general: null, fields: {} });

  const abortControllerRef = useRef(null);

  // Auto-dismiss notice after 5 seconds
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Fetch when page, pageSize, or refreshTrigger changes
  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    async function fetchPatients() {
      try {
        const data = await listPatients(page, pageSize, controller.signal);
        if (!ignore) {
          const results = data.results || [];
          setPatients(results);
          setCount(data.count || 0);

          // Detect staff vs patient from results
          if (results.length > 1) {
            setIsStaff(true);
            localStorage.setItem('is_staff', 'true');
          } else if (results.length === 1 && results[0].is_staff !== undefined) {
            const staffVal = Boolean(results[0].is_staff);
            setIsStaff(staffVal);
            localStorage.setItem('is_staff', String(staffVal));
            if (!staffVal) {
              setCurrentUserId(results[0].id);
              localStorage.setItem('user_id', String(results[0].id));
            }
          }

          setLoading(false);
        }
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') {
          return;
        }

        if (!ignore) {
          if (err.response && err.response.status === 404 && page > 1) {
            setPage(1);
          } else {
            const { general } = extractErrors(err);
            setPageError(general || 'Failed to load patients list.');
          }
          setLoading(false);
        }
      }
    }

    fetchPatients();

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [page, pageSize, refreshTrigger]);

  const totalPages = Math.max(1, Math.ceil(count / pageSize));

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setPage(1); // Changing page size resets to page 1
  };

  // Patient Create & Update Handlers
  const handleCreatePatient = async (payload) => {
    setFormSubmitting(true);
    setFormErrors({ general: null, fields: {} });
    setNotice(null);

    try {
      await createPatient(payload);
      setNotice('Patient created successfully.');
      setFormErrors({ general: null, fields: {} });
      setIsPatientFormOpen(false);
      triggerRefresh();
    } catch (err) {
      const parsed = extractErrors(err);
      setFormErrors(parsed);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdatePatient = async (payload) => {
    if (!editingPatient) return;

    setFormSubmitting(true);
    setFormErrors({ general: null, fields: {} });
    setNotice(null);

    try {
      await updatePatient(editingPatient.id, payload);
      setNotice(`Patient #${editingPatient.id} updated successfully.`);
      setEditingPatient(null);
      setFormErrors({ general: null, fields: {} });
      setIsPatientFormOpen(false);
      triggerRefresh();
    } catch (err) {
      const parsed = extractErrors(err);
      setFormErrors(parsed);
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleFormSubmit = (payload) => {
    if (editingPatient) {
      handleUpdatePatient(payload);
    } else {
      handleCreatePatient(payload);
    }
  };

  const handleStartEdit = (patient) => {
    setEditingPatient(patient);
    setFormErrors({ general: null, fields: {} });
    setIsPatientFormOpen(true);
    setIsVisitFormOpen(false);

    setTimeout(() => {
      const formElement = document.getElementById('patient-form-section');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleCancelEdit = () => {
    setEditingPatient(null);
    setFormErrors({ general: null, fields: {} });
    setIsPatientFormOpen(false);
  };

  const handleDeletePatient = async (patient) => {
    const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim();
    const confirmed = window.confirm(
      `Are you sure you want to delete patient "${fullName}" (ID: ${patient.id}, Mobile: ${patient.mobile})?`
    );
    if (!confirmed) return;

    setPageError(null);
    try {
      await deletePatient(patient.id);
      setNotice(`Patient "${fullName}" was successfully deleted.`);

      if (editingPatient?.id === patient.id) {
        setEditingPatient(null);
        setIsPatientFormOpen(false);
      }

      if (patients.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        triggerRefresh();
      }
    } catch (err) {
      setPageError(getErrorMessage(err));
    }
  };

  // Visit Create Handlers
  const handleCreateVisit = async (payload) => {
    setVisitSubmitting(true);
    setVisitErrors({ general: null, fields: {} });
    setNotice(null);

    try {
      await createVisit(payload);
      setNotice('Patient visit logged successfully.');
      setIsVisitFormOpen(false);
      setPreselectedVisitPatientId(null);
      setVisitErrors({ general: null, fields: {} });
      triggerRefresh();
    } catch (err) {
      const parsed = extractErrors(err);
      setVisitErrors(parsed);
    } finally {
      setVisitSubmitting(false);
    }
  };

  const handleStartLogVisit = (patient) => {
    setPreselectedVisitPatientId(patient ? patient.id : null);
    setVisitErrors({ general: null, fields: {} });
    setIsVisitFormOpen(true);
    setIsPatientFormOpen(false);

    setTimeout(() => {
      const visitElement = document.getElementById('visit-form-section');
      if (visitElement) {
        visitElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  const handleCancelVisit = () => {
    setIsVisitFormOpen(false);
    setPreselectedVisitPatientId(null);
    setVisitErrors({ general: null, fields: {} });
  };

  const handleTogglePatientForm = () => {
    if (isPatientFormOpen) {
      setIsPatientFormOpen(false);
      setEditingPatient(null);
    } else {
      setIsPatientFormOpen(true);
      setEditingPatient(null);
      setIsVisitFormOpen(false);
    }
  };

  const handleToggleVisitForm = () => {
    if (isVisitFormOpen) {
      setIsVisitFormOpen(false);
      setPreselectedVisitPatientId(null);
    } else {
      setIsVisitFormOpen(true);
      setIsPatientFormOpen(false);
    }
  };

  return (
    <div className="portal-container">
      {/* Top Navigation Bar */}
      <header className="portal-header">
        <div className="header-brand">
          <div>
            <h1 className="header-title">
              {isStaff ? 'Patient Management Portal' : 'Patient Health Portal'}
            </h1>
          </div>
        </div>
        <div className="header-actions">
          <span className={`badge ${isStaff ? 'badge-staff' : 'badge-patient'}`}>
            {isStaff ? 'Staff Portal' : 'Patient Portal'}
          </span>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onLogout}
          >
            Log Out
          </button>
        </div>
      </header>

      <main className="portal-main">
        {/* Alerts / Notices */}
        {notice && (
          <div className="alert alert-success" role="alert">
            <span>{notice}</span>
            <button
              type="button"
              className="alert-dismiss"
              onClick={() => setNotice(null)}
              aria-label="Dismiss notice"
            >
              &times;
            </button>
          </div>
        )}

        {pageError && (
          <div className="alert alert-error" role="alert">
            <span>{pageError}</span>
            <button
              type="button"
              className="alert-dismiss"
              onClick={() => setPageError(null)}
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        {/* Dropdown Action Toolbar */}
        <section className="portal-section">
          <div className="portal-action-toolbar">
            {isStaff && (
              <button
                type="button"
                className={`btn ${isPatientFormOpen ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={handleTogglePatientForm}
              >
                {isPatientFormOpen
                  ? editingPatient
                    ? '▲ Close Edit Form'
                    : '▲ Close Add Form'
                  : '▼ Add New Patient'}
              </button>
            )}

            <button
              type="button"
              className={`btn ${isVisitFormOpen ? 'btn-success' : 'btn-outline-success'}`}
              onClick={handleToggleVisitForm}
            >
              {isVisitFormOpen ? '▲ Close Visit Form' : '▼ Log Patient Visit'}
            </button>
          </div>
        </section>

        {/* Section 1: Add / Edit Patient Form (Staff only for Add mode; also shown on Edit) */}
        {(isStaff || editingPatient) && isPatientFormOpen && (
          <section className="portal-section collapsible-container">
            <PatientForm
              key={editingPatient ? editingPatient.id : 'create'}
              editingPatient={editingPatient}
              onSubmit={handleFormSubmit}
              onCancel={handleCancelEdit}
              loading={formSubmitting}
              errors={formErrors}
            />
          </section>
        )}

        {/* Section 2: Log Patient Visit Form (Both Staff and Patient) */}
        {isVisitFormOpen && (
          <section className="portal-section collapsible-container">
            <VisitForm
              key={preselectedVisitPatientId ? `visit-${preselectedVisitPatientId}` : 'new-visit'}
              isStaff={isStaff}
              currentUserId={currentUserId}
              patients={patients}
              preselectedPatientId={preselectedVisitPatientId}
              onSubmit={handleCreateVisit}
              onCancel={handleCancelVisit}
              loading={visitSubmitting}
              errors={visitErrors}
            />
          </section>
        )}

        {/* Section 3: Patient Table & Pagination */}
        <section className="portal-section">
          <div className="card table-card">
            <div className="card-header table-header-flex">
              <div>
                <h3>{isStaff ? 'Registered Patients' : 'Your Patient Record'}</h3>
                <p className="section-description">
                  {isStaff
                    ? 'View, update, or remove patient records. Ordered by ID.'
                    : 'Your personal health profile and visit statistics.'}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={triggerRefresh}
                disabled={loading}
                title="Refresh current list"
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            <PatientTable
              patients={patients}
              onEdit={handleStartEdit}
              onDelete={handleDeletePatient}
              onLogVisit={handleStartLogVisit}
              isStaff={isStaff}
              loading={loading}
            />

            {isStaff && (
              <Pagination
                page={page}
                totalPages={totalPages}
                totalCount={count}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                disabled={loading}
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
