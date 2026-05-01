import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchWarranties } from "@/services/warrantyService";

export function useWarranties() {
  const [warranties, setWarranties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadWarranties() {
      try {
        const data = await fetchWarranties();
        if (!ignore) {
          setWarranties(data);
        }
      } catch (error) {
        if (!ignore) {
          toast.error(error.response?.data?.message || "Unable to load warranties.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadWarranties();

    return () => {
      ignore = true;
    };
  }, []);

  return { warranties, isLoading };
}
