import { Box, TextField, Button, IconButton, Tooltip, Menu, MenuItem, Divider, FormControlLabel, Checkbox } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import FilterListIcon from "@mui/icons-material/FilterList";
import SortIcon from "@mui/icons-material/Sort";
import ViewWeekIcon from "@mui/icons-material/ViewWeek";
import { useRef, useState } from "react";
import { InputAdornment } from "@mui/material";

/**
 * Componente reutilizable para barra de herramientas de tabla
 * @param {string} searchValue - Valor actual de búsqueda
 * @param {function} onSearchChange - Callback cuando cambia búsqueda
 * @param {string} searchPlaceholder - Texto placeholder de búsqueda
 * @param {array} sortOptions - Opciones de ordenamiento [{label, value}]
 * @param {string} sortValue - Valor actual de ordenamiento
 * @param {function} onSortChange - Callback cuando cambia ordenamiento
 * @param {object} filterValue - Objeto con valores de filtros
 * @param {function} onFilterChange - Callback cuando cambia filtro
 * @param {array} filterOptions - Opciones de filtro [{label, value, options: []}]
 * @param {object} visibleColumns - Objeto con columnas visibles {col1: true, col2: false}
 * @param {function} onColumnChange - Callback cuando cambia visibilidad de columna
 * @param {boolean} showClearButton - Mostrar botón limpiar
 * @param {function} onClearAll - Callback para limpiar todos los filtros incluyendo fecha
 * @param {string} dateFilter - Estado actual del filtro de período (todos, hoy, esta-semana, etc)
 */
export const TableToolbar = ({
  searchValue = "",
  onSearchChange = () => {},
  searchPlaceholder = "",
  sortOptions = [],
  sortValue = "",
  onSortChange = () => {},
  filterValue = {},
  onFilterChange = () => {},
  filterOptions = [],
  visibleColumns = {},
  onColumnChange = () => {},
  showClearButton = false,
  onClearAll = () => {},
  dateFilter = "todos",
}) => {
  const [openSort, setOpenSort] = useState(false);
  const [openColumns, setOpenColumns] = useState(false);
  const sortRef = useRef(null);
  const columnsRef = useRef(null);

  const hasActiveFilters = searchValue || Object.values(filterValue).some(v => v && v !== "todos") || (dateFilter && dateFilter !== "todos");

  return (
    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-end" }}>
      {/* Buscador con placeholder */}
      <Box sx={{ flex: 1, minWidth: "250px" }}>
        <TextField
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          size="small"
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#d7171a" }} />
              </InputAdornment>
            ),
            endAdornment: searchValue && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => onSearchChange("")}
                  sx={{ cursor: "pointer" }}
                >
                  <ClearIcon sx={{ fontSize: "1.2rem" }} />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Filtros */}
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-end", flexWrap: "wrap" }}>
        {filterOptions.length > 0 && filterOptions.map((filter) => (
          <TextField
            key={filter.name}
            select
            label={filter.label}
            value={filterValue[filter.name] || filter.defaultValue || ""}
            onChange={(e) => onFilterChange(filter.name, e.target.value)}
            size="small"
            sx={{ minWidth: "140px" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FilterListIcon sx={{ color: "#d7171a", mr: 1 }} />
                </InputAdornment>
              ),
            }}
          >
            {filter.options.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </TextField>
        ))}

        {/* Botón Sort */}
        {sortOptions.length > 0 && (
          <>
            <Tooltip title="Ordenar">
              <IconButton
                ref={sortRef}
                onClick={() => setOpenSort(true)}
                sx={{
                  color: "#d7171a",
                  border: "1px solid #d7171a",
                  borderRadius: 1,
                  p: 1,
                }}
              >
                <SortIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={sortRef.current}
              open={openSort}
              onClose={() => setOpenSort(false)}
            >
              {sortOptions.map((opt) => (
                <MenuItem
                  key={opt.value}
                  onClick={() => {
                    onSortChange(opt.value);
                    setOpenSort(false);
                  }}
                  selected={sortValue === opt.value}
                >
                  {opt.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {/* Botón Manage Columns */}
        {Object.keys(visibleColumns).length > 0 && (
          <>
            <Tooltip title="Gestionar columnas">
              <IconButton
                ref={columnsRef}
                onClick={() => setOpenColumns(true)}
                sx={{
                  color: "#d7171a",
                  border: "1px solid #d7171a",
                  borderRadius: 1,
                  p: 1,
                }}
              >
                <ViewWeekIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={columnsRef.current}
              open={openColumns}
              onClose={() => setOpenColumns(false)}
            >
              {Object.entries(visibleColumns).map(([col, visible]) => (
                <MenuItem
                  key={col}
                  onClick={() => onColumnChange(col, !visible)}
                  sx={{ display: "block" }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={visible}
                        onChange={(e) => onColumnChange(col, e.target.checked)}
                        size="small"
                      />
                    }
                    label={col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, " $1")}
                    sx={{ width: "100%", m: 0 }}
                  />
                </MenuItem>
              ))}
            </Menu>
          </>
        )}

        {/* Botón Limpiar */}
        {showClearButton && hasActiveFilters && (
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              onSearchChange("");
              filterOptions.forEach(f => onFilterChange(f.name, f.defaultValue || ""));
              onClearAll();
            }}
            sx={{ color: "#d7171a", borderColor: "#d7171a" }}
          >
            Limpiar
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default TableToolbar;
