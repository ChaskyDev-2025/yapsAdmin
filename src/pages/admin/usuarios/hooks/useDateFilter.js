import { useMemo } from "react";

export function useDateFilter(items, dateFilterType, customStartDate, customEndDate, sortBy, dateField = "createdAt") {
  return useMemo(() => {
    if (!items || items.length === 0) return [];

    let filtered = [...items];

    // Aplicar filtro de fecha
    if (dateFilterType && dateFilterType !== "todos") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      filtered = filtered.filter((item) => {
        const itemDate = item[dateField];
        if (!itemDate) return false;

        let date;
        if (typeof itemDate === "object" && itemDate.seconds) {
          // Firebase Timestamp
          date = new Date(itemDate.seconds * 1000);
        } else if (typeof itemDate === "number") {
          // Unix timestamp in milliseconds
          date = new Date(itemDate);
        } else if (typeof itemDate === "string") {
          // String date
          date = new Date(itemDate);
        } else {
          return false;
        }

        switch (dateFilterType) {
          case "hoy":
            return date >= startOfToday && date < endOfToday;

          case "esta-semana": {
            const startOfWeek = new Date(startOfToday);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            return date >= startOfWeek && date < endOfToday;
          }

          case "este-mes": {
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return date >= startOfMonth && date < endOfMonth;
          }

          case "ultimos-7": {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return date >= sevenDaysAgo && date <= now;
          }

          case "ultimos-30": {
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return date >= thirtyDaysAgo && date <= now;
          }

          case "custom": {
            if (customStartDate && customEndDate) {
              const start = new Date(customStartDate);
              const end = new Date(customEndDate);
              end.setDate(end.getDate() + 1);
              return date >= start && date < end;
            }
            return true;
          }

          default:
            return true;
        }
      });
    }

    // Aplicar ordenamiento
    if (sortBy) {
      const sorted = [...filtered];
      
      switch (sortBy) {
        case "recientes":
          sorted.sort((a, b) => {
            const dateA = getDate(a[dateField]);
            const dateB = getDate(b[dateField]);
            return dateB - dateA; // Más recientes primero
          });
          break;

        case "antiguos":
          sorted.sort((a, b) => {
            const dateA = getDate(a[dateField]);
            const dateB = getDate(b[dateField]);
            return dateA - dateB; // Más antiguos primero
          });
          break;

        case "a-z":
          sorted.sort((a, b) => {
            const nameA = (a.nombre || a.email || "").toLowerCase();
            const nameB = (b.nombre || b.email || "").toLowerCase();
            return nameA.localeCompare(nameB);
          });
          break;

        case "z-a":
          sorted.sort((a, b) => {
            const nameA = (a.nombre || a.email || "").toLowerCase();
            const nameB = (b.nombre || b.email || "").toLowerCase();
            return nameB.localeCompare(nameA);
          });
          break;

        default:
          break;
      }

      return sorted;
    }

    return filtered;
  }, [items, dateFilterType, customStartDate, customEndDate, sortBy, dateField]);
}

function getDate(dateValue) {
  if (!dateValue) return new Date(0);

  if (typeof dateValue === "object" && dateValue.seconds) {
    // Firebase Timestamp
    return new Date(dateValue.seconds * 1000);
  } else if (typeof dateValue === "number") {
    // Unix timestamp
    return new Date(dateValue);
  } else if (typeof dateValue === "string") {
    return new Date(dateValue);
  }

  return new Date(0);
}
