import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function PatientRedirect() {
  const { fileNo } = useParams<{ fileNo: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the correct path
    navigate(`/emr/dashboard/patients/${fileNo}`, { replace: true });
  }, [fileNo, navigate]);

  return null;
}