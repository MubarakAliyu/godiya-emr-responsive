// Simply re-export the nurse full file component for use by doctors
// Both nurses and doctors need to see the same comprehensive patient file
export { NursePatientFullFilePage as DoctorPatientFullFilePage } from '../nurse/patient-full-file';
