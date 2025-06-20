'use client';

import { useState, useEffect, useCallback } from 'react';
import { Mantenimiento } from '@/types/fleet';
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
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui-elements/alert';
import Link from 'next/link';

interface MantenimientoTableProps {
  vehicleId?: number; // Optional prop to filter maintenances by vehicle
}

const MantenimientoTable = ({ vehicleId }: MantenimientoTableProps) => {
  const router = useRouter();
  const [mantenimientos, setMantenimientos] = useState<Mantenimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  const [search, setSearch] = useState('');
  const [formStatus, setFormStatus] = useState<{ type: 'success' | 'error' | ''; message: string }>({ type: '', message: '' });

  const fetchMantenimientos = useCallback(async () => {
    setLoading(true);
    setError(null);
    setFormStatus({ type: '', message: '' });
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        search,
      });
      if (vehicleId) {
        params.append('vehicleId', vehicleId.toString());
      }
      const res = await fetch(`/api/mantenimientos?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch maintenances');
      }
      const data = await res.json();
      setMantenimientos(data.data);
      setTotalPages(data.totalPages);
    } catch (err: any) {
      setError(err.message || 'Error al cargar mantenimientos.');
      setFormStatus({ type: 'error', message: err.message || 'Error al cargar mantenimientos.' });
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, search, vehicleId]);

  useEffect(() => {
    fetchMantenimientos();
  }, [fetchMantenimientos]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este mantenimiento?')) {
      return;
    }
    setLoading(true);
    setFormStatus({ type: '', message: '' });
    try {
      const res = await fetch(`/api/mantenimientos/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al eliminar el mantenimiento.');
      }
      setFormStatus({ type: 'success', message: 'Mantenimiento eliminado exitosamente.' });
      fetchMantenimientos(); // Re-fetch data after deletion
    } catch (err: any) {
      setFormStatus({ type: 'error', message: err.message || 'Ocurrió un error al eliminar el mantenimiento.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      {formStatus.type && (
        <Alert
          variant={formStatus.type === 'success' ? 'success' : 'error'}
          title={formStatus.type === 'success' ? 'Éxito' : 'Error'}
          description={formStatus.message}
        />
      )}

      <div className="mb-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Buscar mantenimiento..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-1/3 rounded-lg border border-stroke bg-transparent px-5.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary"
        />
        {!vehicleId && ( // Only show "Crear Mantenimiento" button if not filtered by vehicle
          <Link href="/fleet/mantenimientos/new" className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
            Crear Mantenimiento
          </Link>
        )}
      </div>

      {loading ? (
        <p>Cargando mantenimientos...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
                <TableHead className="min-w-[155px] xl:pl-7.5 cursor-pointer" onClick={() => handleSort('tipo')}>
                  Tipo {sortBy === 'tipo' && (sortOrder === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('fecha')}>
                  Fecha {sortBy === 'fecha' && (sortOrder === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('costo')}>
                  Costo {sortBy === 'costo' && (sortOrder === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort('estado')}>
                  Estado {sortBy === 'estado' && (sortOrder === 'asc' ? '▲' : '▼')}
                </TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead className="text-right xl:pr-7.5">Acciones</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {mantenimientos.map((mantenimiento) => (
                <TableRow key={mantenimiento.id} className="border-[#eee] dark:border-dark-3">
                  <TableCell className="min-w-[155px] xl:pl-7.5">
                    <h5 className="text-dark dark:text-white">{mantenimiento.tipo}</h5>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {mantenimiento.fecha ? new Date(mantenimiento.fecha).toLocaleDateString() : 'N/A'}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      ${mantenimiento.costo.toFixed(2)}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {mantenimiento.estado}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {mantenimiento.descripcion.length > 50 ? mantenimiento.descripcion.substring(0, 50) + '...' : mantenimiento.descripcion}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {mantenimiento.vehicle ? `${mantenimiento.vehicle.marca} (${mantenimiento.vehicle.matricula})` : 'N/A'}
                    </p>
                  </TableCell>
                  <TableCell className="xl:pr-7.5">
                    <div className="flex items-center justify-end gap-x-3.5">
                      <Link href={`/fleet/mantenimientos/${mantenimiento.id}`} className="hover:text-primary">
                        <span className="sr-only">Ver Mantenimiento</span>
                        <PreviewIcon />
                      </Link>
                      <Link href={`/fleet/mantenimientos/${mantenimiento.id}/edit`} className="hover:text-primary">
                        <span className="sr-only">Editar Mantenimiento</span>
                        <PencilSquareIcon />
                      </Link>
                      <button onClick={() => handleDelete(mantenimiento.id)} className="hover:text-primary">
                        <span className="sr-only">Eliminar Mantenimiento</span>
                        <TrashIcon />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="mt-5 flex justify-between items-center">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1 || loading}
              className="inline-flex items-center justify-center rounded-md border border-stroke bg-gray-2 py-2 px-4 text-center font-medium text-dark hover:bg-opacity-90 dark:border-dark-3 dark:bg-dark-2 dark:text-white disabled:opacity-50"
            >
              Anterior
            </button>
            <span className="text-dark dark:text-white">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages || loading}
              className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-4 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MantenimientoTable;
