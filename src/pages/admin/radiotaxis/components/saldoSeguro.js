// src/pages/admin/radiotaxis/components/saldoSeguro.js
// Lógica centralizada para actualizar el saldo impidiendo que quede negativo.
// Usa transacciones de Firestore para evitar condiciones de carrera.

import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../data/firebase/firebase";

/**
 * Redondea a 2 decimales evitando errores de coma flotante
 */
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

/**
 * Valida localmente si un movimiento puede aplicarse sin dejar saldo negativo.
 * @param {number} saldoActual - Saldo disponible actual (número)
 * @param {number} delta - Monto a aplicar (positivo para sumar, negativo para restar)
 * @returns {{ok: boolean, error?: string, siguiente?: number}}
 */
export const puedeAplicarMovimiento = (saldoActual, delta) => {
  const s = Number(saldoActual);
  const d = Number(delta);
  if (!isFinite(d) || d === 0) return { ok: false, error: "Monto inválido" };
  if (d < 0 && Math.abs(d) > s) {
    return {
      ok: false,
      error: `No puedes restar Bs. ${round2(Math.abs(d)).toFixed(2)}; disponible Bs. ${round2(s).toFixed(2)}.`,
    };
  }
  const siguiente = round2(s + d);
  if (siguiente < 0) return { ok: false, error: "El saldo no puede quedar negativo" };
  return { ok: true, siguiente };
};

/**
 * Aplica un movimiento al saldo de forma SEGURA con transacción.
 * - Si el delta es negativo y supera el saldo en Firestore, lanza error.
 * - Garantiza que el saldo nunca quede por debajo de 0, incluso con concurrencia.
 * @param {string} userId - ID del documento en `users`
 * @param {number} delta - +N para sumar, -N para restar
 */
export async function actualizarSaldoSeguro(userId, delta) {
  if (!userId) throw new Error("ID de usuario no disponible");
  const d = Number(delta);
  if (!isFinite(d) || d === 0) throw new Error("Monto inválido");

  const ref = doc(db, "trabajadores", userId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Usuario no encontrado");

    const data = snap.data();
    // Buscar saldo en la raíz del documento o en empresa.saldo (por compatibilidad)
    const saldoActual = Number(data?.saldo ?? data?.empresa?.saldo ?? 0);

    if (d < 0 && Math.abs(d) > saldoActual) {
      throw new Error(
        `No puedes restar Bs. ${round2(Math.abs(d)).toFixed(2)}; disponible Bs. ${round2(saldoActual).toFixed(2)}.`
      );
    }

    const nuevoSaldo = round2(saldoActual + d);
    if (nuevoSaldo < 0) throw new Error("El saldo no puede quedar negativo");

    tx.update(ref, {
      saldo: nuevoSaldo,
      updatedAt: serverTimestamp(),
    });
  });
}
