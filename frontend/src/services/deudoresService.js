// src/services/deudoresService.js
import apiRequest from "../config/googleSheets";

const deudoresService = {
  async obtenerDeudores() {
    try {
      console.log("📋 Obteniendo deudores...");
      const response = await apiRequest("getDeudores");
      return response.data || [];
    } catch (error) {
      console.error("Error al obtener deudores:", error);
      throw new Error("No se pudieron cargar los deudores.");
    }
  },

  async obtenerDeudorPorId(id) {
    try {
      const deudores = await this.obtenerDeudores();
      const deudor = deudores.find((d) => d.id === parseInt(id));

      if (!deudor) {
        throw new Error("Deudor no encontrado");
      }

      return deudor;
    } catch (error) {
      console.error("Error al obtener deudor:", error);
      throw error;
    }
  },

  async crearDeudor(deudor) {
    try {
      if (!deudor.nombre || deudor.nombre.trim() === "") {
        throw new Error("El nombre del deudor es obligatorio");
      }

      console.log("👤 Creando deudor:", deudor.nombre);

      const response = await apiRequest("crearDeudor", {
        nombre: deudor.nombre.trim(),
        telefono: deudor.telefono?.trim() || "",
      });

      console.log("✅ Deudor creado");
      return response.data;
    } catch (error) {
      console.error("Error al crear deudor:", error);
      throw error;
    }
  },

  async buscarDeudor(termino) {
    try {
      if (!termino || termino.trim() === "") {
        return await this.obtenerDeudores();
      }

      const deudores = await this.obtenerDeudores();
      const terminoLower = termino.toLowerCase().trim();

      return deudores.filter(
        (d) =>
          d.nombre.toLowerCase().includes(terminoLower) ||
          (d.telefono && d.telefono.includes(termino)) ||
          d.id.toString().includes(termino),
      );
    } catch (error) {
      console.error("Error al buscar deudor:", error);
      throw error;
    }
  },

  async crearDeuda(deuda) {
    try {
      if (!deuda.deudorId) {
        throw new Error("Debe seleccionar un deudor");
      }
      if (!deuda.monto || deuda.monto <= 0) {
        throw new Error("El monto debe ser mayor a 0");
      }

      console.log("💳 Creando deuda:", deuda);

      const response = await apiRequest("crearDeuda", {
        deudorId: parseInt(deuda.deudorId),
        ventaId: deuda.ventaId || "",
        monto: parseFloat(deuda.monto),
      });

      console.log("✅ Deuda creada");
      return response.data;
    } catch (error) {
      console.error("Error al crear deuda:", error);
      throw error;
    }
  },

  async obtenerDeudasPorDeudor(deudorId) {
    try {
      if (!deudorId) {
        throw new Error("ID de deudor no válido");
      }

      const response = await apiRequest("getDeudasPorDeudor", {
        deudorId: parseInt(deudorId),
      });

      return response.data || [];
    } catch (error) {
      console.error("Error al obtener deudas:", error);
      throw error;
    }
  },

  async registrarAbono(abono) {
  try {
    // 🔍 DEBUG: Ver qué llega
    console.log("💰 Datos recibidos en registrarAbono:", abono);
    console.log("   deudorId:", abono.deudorId, "tipo:", typeof abono.deudorId);
    console.log("   deudaId:", abono.deudaId, "tipo:", typeof abono.deudaId);
    
    if (!abono.deudaId) {
      throw new Error("Debe seleccionar una deuda");
    }
    if (!abono.deudorId) {
      throw new Error("ID de deudor requerido");
    }
    if (!abono.monto || abono.monto <= 0) {
      throw new Error("El monto del abono debe ser mayor a 0");
    }

    console.log("💰 Registrando abono:", abono);

    // 🔧 Asegurar que los IDs sean números válidos antes de enviar
    const deudorIdNum = parseInt(abono.deudorId);
    const deudaIdNum = parseInt(abono.deudaId);
    
    if (isNaN(deudorIdNum)) {
      console.error("❌ deudorId no es un número:", abono.deudorId);
      throw new Error("ID de deudor inválido");
    }
    
    if (isNaN(deudaIdNum)) {
      console.error("❌ deudaId no es un número:", abono.deudaId);
      throw new Error("ID de deuda inválido");
    }

    const response = await apiRequest("registrarAbono", {
      deudorId: deudorIdNum,
      deudaId: deudaIdNum,
      monto: parseFloat(abono.monto),
      metodoPago: abono.metodoPago || 'efectivo',
      notas: abono.notas?.trim() || "",
      registradoPor: abono.registradoPor,
    });

    console.log("✅ Respuesta registrarAbono:", response);
    return response.data;
  } catch (error) {
    console.error("Error al registrar abono:", error);
    throw error;
  }
},
  async obtenerDeudorConDetalles(deudorId) {
    try {
      const deudor = await this.obtenerDeudorPorId(deudorId);
      const deudas = await this.obtenerDeudasPorDeudor(deudorId);

      return {
        ...deudor,
        deudas,
        totalDeudas: deudas.length,
        deudasPendientes: deudas.filter((d) => d.estado === "pendiente").length,
        deudasPagadas: deudas.filter((d) => d.estado === "pagado").length,
      };
    } catch (error) {
      console.error("Error al obtener deudor con detalles:", error);
      throw error;
    }
  },

  async validarMontoAbono(deudaId, deudorId, montoAbono) {
    const deudas = await this.obtenerDeudasPorDeudor(deudorId);
    const deuda = deudas.find((d) => d.id === parseInt(deudaId));

    if (!deuda) {
      throw new Error("Deuda no encontrada");
    }

    if (montoAbono > deuda.saldo) {
      throw new Error(
        `El abono no puede ser mayor al saldo pendiente ($${deuda.saldo.toLocaleString()})`,
      );
    }

    return true;
  },
};

export default deudoresService;
