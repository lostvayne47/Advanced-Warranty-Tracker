import { useCallback, useEffect, useState } from "react";
import { fetchWarranties } from "@/services/warrantyService";
import { getApiError } from "@/utils/apiErrors";

export function useWarranties() {
  const [warranties, setWarranties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);
  const removeWarranty = useCallback((id) => {
    setWarranties((items) => items.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setError("");
    fetchWarranties()
      .then((data) => { if (!ignore) setWarranties(data); })
      .catch((error) => { if (!ignore) setError(getApiError(error, "Unable to load warranties.")); })
      .finally(() => { if (!ignore) setIsLoading(false); });
    return () => { ignore = true; };
  }, [revision]);

  return { warranties, isLoading, error, retry, removeWarranty };
}
