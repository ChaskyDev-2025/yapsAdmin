import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";
import { useAuth } from "../../../../auth/AuthContext";

export const useFlotaInfo = () => {
  const { userFlotaId } = useAuth();
  const [flota, setFlota] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlota = async () => {
      if (!userFlotaId) {
        setLoading(false);
        return;
      }

      try {
        const flotaDoc = await getDoc(doc(db, "flotas", userFlotaId));
        if (flotaDoc.exists()) {
          setFlota(flotaDoc.data());
        }
      } catch (error) {
        console.error("Error fetching flota info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlota();
  }, [userFlotaId]);

  return { flota, loading };
};
