'use client';

import Breadcrumbs from '@/components/Breadcrumbs/Breadcrumb';
import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FuelOperation, FuelCard, Vehicle } from '@/types/fleet';
import dayjs from 'dayjs';
import Link from 'next/link';

const ViewFuelOperationPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const router = useRouter();
  const { id } = use(params);
  const [fuelOperation, setFuelOperation] = useState<(FuelOperation & { fuelCard: FuelCard; vehicle: Vehicle | null }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFuelOperation = async () => {
      try {
        const response = await fetch(`/api/fuel-operations/${id}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setFuelOperation(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchFuelOperation();
    }
  }, [id]);

  if (loading) return <p>Cargando detalles de la operación de combustible...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!fuelOperation) return <p>No se encontró la operación de combustible.</p>;

  return (
    <>
      <Breadcrumbs
        pageName="Detalles de Operación de Combustible"
        links={[
          { href: '/fleet', label: 'Flota' },
          { href: '/fleet/fuel-operations', label: 'Operaciones de Combustible' },
          { href: `/fleet/fuel-operations/${id}`, label: 'Detalles' },
        ]}
      />

      <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-dark dark:text-white mb-4">Información de la Operación</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p><strong>Tipo de Operación:</strong> {fuelOperation.tipoOperacion}</p>
            <p><strong>Fecha:</strong> {dayjs(fuelOperation.fecha).format('DD/MM/YYYY HH:mm')}</p>
            <p><strong>Tarjeta:</strong> {fuelOperation.fuelCard.numeroDeTarjeta}</p>
            <p><strong>Saldo Inicio:</strong> {fuelOperation.saldoInicio.toFixed(2)}</p>
            <p><strong>Valor Operación (Dinero):</strong> {fuelOperation.valorOperacionDinero.toFixed(2)}</p>
            <p><strong>Valor Operación (Litros):</strong> {fuelOperation.valorOperacionLitros.toFixed(2)}</p>
            <p><strong>Saldo Final:</strong> {fuelOperation.saldoFinal.toFixed(2)}</p>
            <p><strong>Saldo Final (Litros):</strong> {fuelOperation.saldoFinalLitros.toFixed(2)}</p>
            <p><strong>Vehículo Destino:</strong> {fuelOperation.vehicle?.matricula || 'N/A'}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <Link href={`/fleet/fuel-operations/${id}/edit`}>
            <button className="inline-flex items-center justify-center rounded-md bg-primary py-2 px-4 text-center font-medium text-white hover:bg-opacity-90 lg:px-8 xl:px-10">
              Editar
            </button>
          </Link>
          <button
            type="button"
            onClick={() => router.push('/fleet/fuel-operations')}
            className="inline-flex items-center justify-center rounded-md border border-stroke bg-gray-2 py-2 px-4 text-center font-medium text-dark hover:bg-opacity-90 dark:border-dark-3 dark:bg-dark-2 dark:text-white lg:px-8 xl:px-10"
          >
            Volver
          </button>
        </div>
      </div>
    </>
  );
};

export default ViewFuelOperationPage;
