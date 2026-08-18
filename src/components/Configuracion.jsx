import React, { useState, useEffect } from 'react';
import { getSystemConfig, updateSystemConfig, reprocesarHistorial } from '../services/auditService';
import { Settings, Save, RefreshCw, CheckCircle, AlertTriangle, AlertCircle, X } from 'lucide-react';
import './Configuracion.css';

function Configuracion() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reprocesando, setReprocesando] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Estado para el Modal
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'info', // 'confirm', 'success', 'error'
    title: '',
    message: '',
    onConfirm: null
  });

  const closeModal = () => setModal({ ...modal, isOpen: false });

  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      const data = await getSystemConfig();
      setConfig(data);
    } catch (error) {
      console.error("Error al cargar configuración", error);
      showToast("error", "Error al cargar configuración de la base de datos.");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);
    try {
      const payload = {
        admin_max: parseFloat(config.admin_max),
        cuota_min: parseFloat(config.cuota_min),
        system_prompt: config.system_prompt,
        batch_prompt: config.batch_prompt,
        chat_multi_prompt: config.chat_multi_prompt,
        chat_global_prompt: config.chat_global_prompt
      };
      await updateSystemConfig(payload);
      
      const verifyData = await getSystemConfig();
      if (verifyData.admin_max === payload.admin_max && verifyData.cuota_min === payload.cuota_min) {
        showToast("success", "Configuración guardada y verificada exitosamente.");
      } else {
        showToast("warning", "Se guardó, pero los valores verificados difieren. Revisa tu conexión.");
      }
    } catch (error) {
      console.error(error);
      showToast("error", "Error al guardar. Verifica que el backend esté conectado.");
    } finally {
      setSaving(false);
    }
  };

  const handleReprocesar = () => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Confirmar Reprocesamiento Global',
      message: '¿Estás absolutamente seguro de que quieres reprocesar todo el historial? El Cerebro IA re-evaluará todos los documentos con las nuevas reglas. Esto puede tardar varios minutos dependiendo del volumen de datos.',
      onConfirm: async () => {
        closeModal();
        setReprocesando(true);
        setToast(null);
        try {
          const response = await reprocesarHistorial();
          setModal({
            isOpen: true,
            type: 'success',
            title: '¡Operación Exitosa!',
            message: response.message,
            onConfirm: null
          });
        } catch (error) {
          console.error(error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Fallo en Reprocesamiento',
            message: 'Ocurrió un error crítico al intentar reprocesar el historial con la IA.',
            onConfirm: null
          });
        } finally {
          setReprocesando(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="config-loading-wrapper fade-up">
        <div className="spinner"></div>
        <p className="config-loading-text">Cargando configuración del sistema...</p>
      </div>
    );
  }
  
  if (!config) {
    return (
      <div className="config-loading-wrapper fade-up">
        <AlertTriangle size={48} color="#F43F5E" style={{ opacity: 0.8 }} />
        <p style={{ color: '#FB7185', fontWeight: 500, fontSize: '1.1rem' }}>No se pudo establecer conexión con la base de datos.</p>
      </div>
    );
  }

  return (
    <div className="config-container fade-up">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`toast-alert toast-${toast.type}`}>
          {toast.type === 'success' && <CheckCircle size={20} />}
          {toast.type === 'error' && <AlertCircle size={20} />}
          {toast.type === 'warning' && <AlertTriangle size={20} />}
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} className="toast-close">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="config-header">
        <div className="config-icon-wrapper">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="config-title">Configuración: Reglas y Prompts</h1>
          <p className="config-subtitle">Ajuste de Topes Legales y Comportamiento Cognitivo (Cerebro IA)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        
        {/* Sección 1: Reglas de Negocio */}
        <div className="config-section section-1">
          <h3 className="section-title section-header">
            <span className="section-number">1</span>
            Reglas de Negocio Financieras (Ley 21)
          </h3>
          
          <div className="config-grid">
            <div className="form-group">
              <label className="form-label">Límite Máximo Gastos Administración</label>
              <p className="form-hint">Decimal: ej. 0.08 equivale al 8%</p>
              <input 
                type="number" 
                step="0.0001"
                className="form-input"
                value={config.admin_max} 
                onChange={e => setConfig({...config, admin_max: e.target.value})} 
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Límite Mínimo Cuota Monetaria</label>
              <p className="form-hint">Decimal: ej. 0.55 equivale al 55%</p>
              <input 
                type="number" 
                step="0.0001"
                className="form-input"
                value={config.cuota_min} 
                onChange={e => setConfig({...config, cuota_min: e.target.value})} 
                required
              />
            </div>
          </div>
        </div>

        {/* Sección 2: Prompts Cerebro IA */}
        <div className="config-section section-2">
          <h3 className="section-title section-header">
            <span className="section-number">2</span>
            Comportamiento del Cerebro IA (Prompts)
          </h3>
          
          <div className="config-grid">
            <div className="form-group">
              <label className="form-label">Análisis Individual</label>
              <textarea 
                className="form-textarea"
                value={config.system_prompt || ''} 
                onChange={e => setConfig({...config, system_prompt: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Análisis Batch Comparativo</label>
              <textarea 
                className="form-textarea"
                value={config.batch_prompt || ''} 
                onChange={e => setConfig({...config, batch_prompt: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Chat Multi-CCF (Contexto Sesión)</label>
              <textarea 
                className="form-textarea"
                value={config.chat_multi_prompt || ''} 
                onChange={e => setConfig({...config, chat_multi_prompt: e.target.value})} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Chat Global (Tendencias Base de Datos)</label>
              <textarea 
                className="form-textarea"
                value={config.chat_global_prompt || ''} 
                onChange={e => setConfig({...config, chat_global_prompt: e.target.value})} 
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? (
              <RefreshCw size={20} className="animate-spin" />
            ) : (
              <Save size={20} />
            )}
            <span>{saving ? 'Guardando en BD...' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </form>
      
      <hr className="config-divider" />
      
      {/* Sección 3: Reprocesamiento */}
      <div className="config-section section-reprocess">
        <div className="reprocess-flex">
          <div>
            <h3 className="section-title section-header">
              <span className="section-number">3</span>
              Aplicación Retroactiva en Base de Datos
            </h3>
            <p className="reprocess-desc">
              Si alteraste las reglas matemáticas o reescribiste los prompts, el sistema te permite re-auditar absolutamente todo el historial almacenado en la BD con la nueva configuración, garantizando trazabilidad unificada.
            </p>
          </div>
          
          <button 
            type="button" 
            onClick={handleReprocesar} 
            disabled={reprocesando}
            className="btn-reprocess"
          >
            {reprocesando ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                <span>Re-evaluando...</span>
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                <span>Reprocesar Historial Completo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal tipo Bootstrap Dark UI */}
      {modal.isOpen && (
        <div className="modal-overlay" onClick={modal.type !== 'confirm' ? closeModal : null}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className={`modal-header ${modal.type}`}>
              {modal.type === 'error' && <AlertTriangle size={24} />}
              {modal.type === 'success' && <CheckCircle size={24} />}
              {modal.type === 'confirm' && <AlertCircle size={24} />}
              <h3 className="modal-title">{modal.title}</h3>
            </div>
            
            <div className="modal-body">
              {modal.message}
            </div>
            
            <div className="modal-footer">
              {modal.type === 'confirm' && (
                <button type="button" onClick={closeModal} className="btn-modal btn-cancel">
                  Cancelar
                </button>
              )}
              <button 
                type="button"
                onClick={modal.type === 'confirm' ? modal.onConfirm : closeModal}
                className={`btn-modal ${
                  modal.type === 'confirm' ? 'btn-confirm' : 
                  modal.type === 'error' ? 'btn-error' : 
                  'btn-success'
                }`}
              >
                {modal.type === 'confirm' ? 'Sí, Autorizar' : 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Configuracion;
