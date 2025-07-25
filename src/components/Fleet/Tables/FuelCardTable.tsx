"use client";

import { useState, useEffect, useCallback } from "react";
import { FuelCard } from "@/types/fleet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrashIcon, PencilSquareIcon } from "@/assets/icons";
import { PreviewIcon } from "@/components/Tables/icons";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui-elements/alert";
import Link from "next/link";
import Pagination from "@/components/Tables/Pagination";
import AdvancedTableFilter, {
  ColumnFilter,
  ActiveFilters,
} from "../PageElements/AdvancedTableFilter";
import moment from "moment";
import type { Dayjs } from "dayjs";

const FuelCardTable = () => {
  const router = useRouter();
  const [fuelCards, setFuelCards] = useState<FuelCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFuelCardsCount, setTotalFuelCardsCount] = useState(0);
  const [sortBy, setSortBy] = useState("numeroDeTarjeta");
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [formStatus, setFormStatus] = useState<{
    type: "success" | "error" | "";
    message: string;
  }>({ type: "", message: "" });

  const fuelCardColumns: ColumnFilter[] = [
    { key: "numeroDeTarjeta", title: "Número de Tarjeta", type: "text" },
    {
      key: "tipoDeTarjeta",
      title: "Tipo de Tarjeta",
      type: "select",
      options: [
        { value: "Crédito", label: "Crédito" },
        { value: "Débito", label: "Débito" },
        { value: "Prepago", label: "Prepago" },
      ],
    },
    {
      key: "tipoDeCombustible",
      title: "Tipo de Combustible",
      type: "select",
      options: [
        { value: "Gasolina", label: "Gasolina" },
        { value: "Diésel", label: "Diésel" },
        { value: "Eléctrico", label: "Eléctrico" },
      ],
    },
    { key: "precioCombustible", title: "Precio del Combustible", type: "text" },
    { key: "moneda", title: "Moneda", type: "text" },
    {
      key: "fechaVencimiento",
      title: "Fecha de Vencimiento",
      type: "dateRange",
    },
    { key: "esReservorio", title: "Es Reservorio", type: "boolean" },
  ];

  const fetchFuelCards = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFormStatus({ type: "", message: "" });
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      if (activeFilters.globalSearch) {
        params.append("search", activeFilters.globalSearch);
      }

      if (activeFilters.columnFilters) {
        for (const key in activeFilters.columnFilters) {
          const value = activeFilters.columnFilters[key];
          if (value !== undefined && value !== null && value !== "") {
            if (Array.isArray(value)) {
              if (key === "fechaVencimiento" && value[0] && value[1]) {
                const [startDate, endDate] = value as [Dayjs, Dayjs];
                params.append("fechaVencimientoDesde", startDate.toISOString());
                params.append("fechaVencimientoHasta", endDate.toISOString());
              } else if (value.length > 0) {
                params.append(key, value.join(","));
              }
            } else if (typeof value === "boolean") {
              params.append(key, value.toString());
            } else {
              params.append(key, value.toString());
            }
          }
        }
      }

      const res = await fetch(`/api/fuel-cards?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch fuel cards");
      }
      const data = await res.json();
      setFuelCards(data.data);
      setTotalPages(data.totalPages);
      setTotalFuelCardsCount(data.total);
    } catch (err: any) {
      setError(err.message || "Error al cargar tarjetas de combustible.");
      setFormStatus({
        type: "error",
        message: err.message || "Error al cargar tarjetas de combustible.",
      });
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, activeFilters]);

  useEffect(() => {
    fetchFuelCards();
  }, [fetchFuelCards]);

  const handleFilterChange = useCallback((filters: ActiveFilters) => {
    setActiveFilters(filters);
    setPage(1); // Reset to first page on filter change
  }, []);

  useEffect(() => {
    fetchFuelCards();
  }, [fetchFuelCards]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar esta tarjeta de combustible?",
      )
    ) {
      return;
    }
    setLoading(true);
    setFormStatus({ type: "", message: "" });
    try {
      const res = await fetch(`/api/fuel-cards/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error || "Error al eliminar la tarjeta de combustible.",
        );
      }
      setFormStatus({
        type: "success",
        message: "Tarjeta de combustible eliminada exitosamente.",
      });
      fetchFuelCards(); // Re-fetch data after deletion
    } catch (err: any) {
      setFormStatus({
        type: "error",
        message:
          err.message ||
          "Ocurrió un error al eliminar la tarjeta de combustible.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      {formStatus.type && (
        <Alert
          variant={formStatus.type === "success" ? "success" : "error"}
          title={formStatus.type === "success" ? "Éxito" : "Error"}
          description={formStatus.message}
        />
      )}

      <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <AdvancedTableFilter
          columns={fuelCardColumns}
          onFilterChange={handleFilterChange}
          loading={loading}
          applyFiltersAutomatically={true}
        />
        <Link
          href="/fleet/fuel-cards/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10"
        >
          Crear Tarjeta de Combustible
        </Link>
      </div>

      {loading ? (
        <p>Cargando tarjetas de combustible...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
                <TableHead
                  className="min-w-[155px] cursor-pointer xl:pl-7.5"
                  onClick={() => handleSort("numeroDeTarjeta")}
                >
                  Número de Tarjeta{" "}
                  {sortBy === "numeroDeTarjeta" &&
                    (sortOrder === "asc" ? "▲" : "▼")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("tipoDeTarjeta")}
                >
                  Tipo de Tarjeta{" "}
                  {sortBy === "tipoDeTarjeta" &&
                    (sortOrder === "asc" ? "▲" : "▼")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("tipoDeCombustible")}
                >
                  Tipo de Combustible{" "}
                  {sortBy === "tipoDeCombustible" &&
                    (sortOrder === "asc" ? "▲" : "▼")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("precioCombustible")}
                >
                  Precio del Combustible{" "}
                  {sortBy === "precioCombustible" &&
                    (sortOrder === "asc" ? "▲" : "▼")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("moneda")}
                >
                  Moneda{" "}
                  {sortBy === "moneda" && (sortOrder === "asc" ? "▲" : "▼")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("fechaVencimiento")}
                >
                  Fecha de Vencimiento{" "}
                  {sortBy === "fechaVencimiento" &&
                    (sortOrder === "asc" ? "▲" : "▼")}
                </TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => handleSort("esReservorio")}
                >
                  Es Reservorio{" "}
                  {sortBy === "esReservorio" &&
                    (sortOrder === "asc" ? "▲" : "▼")}
                </TableHead>
                <TableHead className="text-right xl:pr-7.5">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {fuelCards.map((fuelCard) => (
                <TableRow
                  key={fuelCard.id}
                  className="border-[#eee] dark:border-dark-3"
                >
                  <TableCell className="min-w-[155px] xl:pl-7.5">
                    <h5 className="text-dark dark:text-white">
                      {fuelCard.numeroDeTarjeta}
                    </h5>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {fuelCard.tipoDeTarjeta}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {fuelCard.tipoDeCombustible}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {fuelCard.precioCombustible}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {fuelCard.moneda}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {fuelCard.fechaVencimiento
                        ? new Date(
                            fuelCard.fechaVencimiento,
                          ).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {fuelCard.esReservorio ? "Sí" : "No"}
                    </p>
                  </TableCell>
                  <TableCell className="xl:pr-7.5">
                    <div className="flex items-center justify-end gap-x-3.5">
                      <Link
                        href={`/fleet/fuel-cards/${fuelCard.id}`}
                        className="hover:text-primary"
                      >
                        <span className="sr-only">
                          Ver Tarjeta de Combustible
                        </span>
                        <PreviewIcon />
                      </Link>
                      <Link
                        href={`/fleet/fuel-cards/${fuelCard.id}/edit`}
                        className="hover:text-primary"
                      >
                        <span className="sr-only">
                          Editar Tarjeta de Combustible
                        </span>
                        <PencilSquareIcon />
                      </Link>
                      <button
                        onClick={() => handleDelete(fuelCard.id)}
                        className="hover:text-primary"
                      >
                        <span className="sr-only">
                          Eliminar Tarjeta de Combustible
                        </span>
                        <TrashIcon />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Pagination
            current={page}
            total={totalFuelCardsCount}
            pageSize={limit}
            onChange={(p, ps) => {
              setPage(p);
              setLimit(ps);
            }}
            onShowSizeChange={(current, size) => {
              setPage(current);
              setLimit(size);
            }}
          />
        </>
      )}
    </div>
  );
};

export default FuelCardTable;
