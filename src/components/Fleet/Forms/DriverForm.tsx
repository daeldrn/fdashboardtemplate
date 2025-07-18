"use client";

import { useState, useEffect } from "react";
import { Driver, Vehicle, DriverStatus } from "@/types/fleet";
import InputGroup from "@/components/FormElements/InputGroup";
import { Select } from "@/components/FormElements/select"; // Import Select component
import { Alert } from "@/components/ui-elements/alert";
import { useRouter } from "next/navigation";

interface DriverFormProps {
  initialData?: Driver;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const DriverForm = ({ initialData, onSuccess, onCancel }: DriverFormProps) => {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<Driver>>(
    initialData
      ? {
          ...initialData,
          fecha_vencimiento_licencia: initialData.fecha_vencimiento_licencia
            ? new Date(initialData.fecha_vencimiento_licencia)
            : null,
          vehicleId: initialData.vehicle?.id || null, // Initialize with existing vehicle ID
        }
      : {
          nombre: "",
          licencia: "",
          fecha_vencimiento_licencia: null,
          carnet_peritage: false,
          estado: "Activo", // Default to 'Activo'
          vehicleId: null,
        },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formStatus, setFormStatus] = useState<{
    type: "success" | "error" | "";
    message: string;
  }>({ type: "", message: "" });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        // Fetch available vehicles (those not already assigned to a driver, or the one currently assigned to this driver)
        const vehiclesRes = await fetch("/api/vehicles");
        const vehiclesData = await vehiclesRes.json();

        // Filter out vehicles that already have a driver, unless it's the vehicle currently assigned to this driver
        const availableVehicles = vehiclesData.data.filter(
          (v: Vehicle) =>
            !v.driverId || (initialData && v.driverId === initialData.id),
        );
        setVehicles(availableVehicles || []);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching form dependencies:", err);
        setFormStatus({
          type: "error",
          message: "Error al cargar datos necesarios para el formulario.",
        });
        setLoading(false);
      }
    };
    fetchDependencies();
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        fecha_vencimiento_licencia: initialData.fecha_vencimiento_licencia
          ? new Date(initialData.fecha_vencimiento_licencia)
          : null,
        vehicleId: initialData.vehicle?.id || null,
      });
    }
  }, [initialData]);

  const validateField = (name: string, value: any): string => {
    let error = "";
    switch (name) {
      case "nombre":
      case "licencia":
      case "estado": // Add validation for estado
        if (!value) error = "Este campo es requerido.";
        break;
      case "fecha_vencimiento_licencia":
        if (!value || isNaN(new Date(value).getTime()))
          error = "Fecha inválida.";
        break;
    }
    return error;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;
    let newValue: any = value;

    if (type === "checkbox") {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (type === "date") {
      newValue = new Date(value);
    } else if (name === "vehicleId") {
      newValue = value === "" ? null : parseInt(value); // Convert to number or null
    }

    setFormData((prev) => ({ ...prev, [name]: newValue }));
    const fieldError = validateField(name, newValue);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));
    console.log(`handleChange: ${name} = ${newValue}, error = ${fieldError}`);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    for (const key in formData) {
      const value = (formData as any)[key];
      const error = validateField(key, value);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    }
    setErrors(newErrors);
    console.log("validateForm: newErrors", newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus({ type: "", message: "" });

    console.log("handleSubmit: formData before validation", formData);
    if (!validateForm()) {
      console.log("handleSubmit: Validation failed, errors:", errors);
      setFormStatus({
        type: "error",
        message: "Por favor, corrige los errores del formulario.",
      });
      return;
    }
    console.log("handleSubmit: Validation passed");

    setLoading(true);
    try {
      const method = initialData ? "PUT" : "POST";
      const url = initialData
        ? `/api/drivers/${initialData.id}`
        : "/api/drivers";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          fecha_vencimiento_licencia:
            formData.fecha_vencimiento_licencia?.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al guardar el conductor.");
      }

      setFormStatus({
        type: "success",
        message: `Conductor ${initialData ? "actualizado" : "creado"} exitosamente.`,
      });
      if (onSuccess) onSuccess();
      router.push("/fleet/drivers");
    } catch (err: any) {
      setFormStatus({
        type: "error",
        message: err.message || "Ocurrió un error inesperado.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && vehicles.length === 0 && !initialData)
    return <p>Cargando formulario...</p>;

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
      {formStatus.type && (
        <Alert
          variant={formStatus.type === "success" ? "success" : "error"}
          title={formStatus.type === "success" ? "Éxito" : "Error"}
          description={formStatus.message}
        />
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <InputGroup
              label="Nombre"
              name="nombre"
              type="text"
              placeholder="Introduce el nombre"
              value={formData.nombre || ""}
              handleChange={handleChange}
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>
            )}
          </div>
          <div>
            <InputGroup
              label="Licencia"
              name="licencia"
              type="text"
              placeholder="Introduce la licencia"
              value={formData.licencia || ""}
              handleChange={handleChange}
            />
            {errors.licencia && (
              <p className="mt-1 text-sm text-red-500">{errors.licencia}</p>
            )}
          </div>
          <div>
            <InputGroup
              label="Fecha de Vencimiento de Licencia"
              name="fecha_vencimiento_licencia"
              type="date"
              placeholder="Selecciona la fecha"
              value={
                formData.fecha_vencimiento_licencia
                  ? formData.fecha_vencimiento_licencia
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              handleChange={handleChange}
            />
            {errors.fecha_vencimiento_licencia && (
              <p className="mt-1 text-sm text-red-500">
                {errors.fecha_vencimiento_licencia}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="carnet_peritage"
              checked={formData.carnet_peritage || false}
              onChange={handleChange}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label
              htmlFor="carnet_peritage"
              className="text-dark dark:text-white"
            >
              Tiene Carnet de Peritaje
            </label>
          </div>
          <div>
            <Select
              label="Estado"
              items={[
                { value: "Activo", label: "Activo" },
                { value: "Inactivo", label: "Inactivo" },
                { value: "Vacaciones", label: "Vacaciones" },
              ]}
              value={formData.estado || ""}
              placeholder="Selecciona un estado"
              onChange={(e) =>
                handleChange(e as React.ChangeEvent<HTMLSelectElement>)
              }
              name="estado"
            />
            {errors.estado && (
              <p className="mt-1 text-sm text-red-500">{errors.estado}</p>
            )}
          </div>
          <div>
            <label
              htmlFor="vehicleId"
              className="mb-3 block text-body-sm font-medium text-dark dark:text-white"
            >
              Vehículo Asignado
            </label>
            <select
              id="vehicleId"
              name="vehicleId"
              value={formData.vehicleId || ""}
              onChange={handleChange}
              className="w-full rounded-lg border border-stroke bg-transparent px-5.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary [&>option]:text-dark-5 dark:[&>option]:text-dark-6"
            >
              <option value="">Sin Vehículo Asignado</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.marca} {vehicle.modelo} ({vehicle.matricula})
                </option>
              ))}
            </select>
            {errors.vehicleId && (
              <p className="mt-1 text-sm text-red-500">{errors.vehicleId}</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-md border border-stroke bg-gray-2 px-4 py-2 text-center font-medium text-dark hover:bg-opacity-90 dark:border-dark-3 dark:bg-dark-2 dark:text-white lg:px-8 xl:px-10"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-center font-medium text-white hover:bg-opacity-90 disabled:opacity-50 lg:px-8 xl:px-10"
          >
            {loading
              ? "Guardando..."
              : initialData
                ? "Actualizar Conductor"
                : "Crear Conductor"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DriverForm;
