import React, { useState, useContext } from 'react';
import { UserContext, axiosInstance } from '../App';

const ProcurementRequestModal = ({ ticket, show, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    item_name: '',
    category: '',
    quantity: 1,
    urgency: 'Medium',
    specifications: '',
    estimated_cost: '',
    vendor_info: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user, theme } = useContext(UserContext);

  const categories = [
    'Computer Hardware',
    'Software License',
    'Network Equipment',
    'Peripherals',
    'Office Supplies',
    'Tools',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage(''); // ✅ CORRECT

    try {
      console.log('🛒 Submitting procurement request for ticket:', ticket.ticket_id);
      
      const requestData = {
        ...formData,
        ticket_id: ticket.ticket_id,
        requested_by: user.id,
        requested_by_name: user.name
      };

      console.log('Request data:', requestData);

      const response = await axiosInstance.post('/api/procurement-requests', requestData);

      console.log('Server response:', response.data);

      if (response.data.success) {
        // SUCCESS - Show success message
        setSuccessMessage('✅ Procurement request submitted successfully!'); // ✅ CORRECT
        
        // Call onSuccess callback with the created request
        if (onSuccess) {
          onSuccess(response.data.request);
        }
        
        // Reset form and close modal after a delay
        setTimeout(() => {
          setFormData({
            item_name: '',
            category: '',
            quantity: 1,
            urgency: 'Medium',
            specifications: '',
            estimated_cost: '',
            vendor_info: '',
            notes: ''
          });
          setSuccessMessage(''); // ✅ CORRECT - FIXED THIS LINE
          onClose();
        }, 1500);
        
      } else {
        // Server returned success: false
        throw new Error(response.data.message || 'Failed to submit procurement request');
      }
    } catch (error) {
      console.error('❌ Submission error:', error);
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit procurement request';
      setError(`❌ ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className={`modal-dialog modal-lg ${theme === 'dark' ? 'modal-dark' : ''}`}>
        <div className={`modal-content ${theme === 'dark' ? 'bg-dark text-light' : ''}`}>
          <div className={`modal-header ${theme === 'dark' ? 'bg-secondary text-light' : ''}`}>
            <h5 className="modal-title">
              🛒 Request Equipment for Ticket #{ticket.ticket_id}
            </h5>
            <button type="button" className={`btn-close ${theme === 'dark' ? 'btn-close-white' : ''}`} onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* SUCCESS MESSAGE */}
              {successMessage && (
                <div className="alert alert-success d-flex align-items-center">
                  <i className="fas fa-check-circle me-2"></i>
                  <span className="flex-grow-1">{successMessage}</span>
                </div>
              )}
              
              {/* ERROR MESSAGE */}
              {error && (
                <div className="alert alert-danger d-flex align-items-center">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <span className="flex-grow-1">{error}</span>
                </div>
              )}
              
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Item Name *</label>
                  <input
                    type="text"
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleChange}
                    required
                    disabled={loading || successMessage}
                  />
                </div>
                
                <div className="col-md-6">
                  <label className="form-label">Category *</label>
                  <select
                    className={`form-select ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    disabled={loading || successMessage}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    required
                    disabled={loading || successMessage}
                  />
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Urgency *</label>
                  <select
                    className={`form-select ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                    name="urgency"
                    value={formData.urgency}
                    onChange={handleChange}
                    required
                    disabled={loading || successMessage}
                  >
                    <option value="Low">🟢 Low</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="High">🔴 High</option>
                    <option value="Critical">🔥 Critical</option>
                  </select>
                </div>
                
                <div className="col-md-4">
                  <label className="form-label">Estimated Cost</label>
                  <input
                    type="text"
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                    name="estimated_cost"
                    value={formData.estimated_cost}
                    onChange={handleChange}
                    placeholder="e.g., $150.00"
                    disabled={loading || successMessage}
                  />
                </div>
                
                <div className="col-12">
                  <label className="form-label">Specifications / Technical Details</label>
                  <textarea
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                    name="specifications"
                    value={formData.specifications}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Brand, model, technical specifications..."
                    disabled={loading || successMessage}
                  />
                </div>
                
                <div className="col-12">
                  <label className="form-label">Preferred Vendor / Source</label>
                  <input
                    type="text"
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                    name="vendor_info"
                    value={formData.vendor_info}
                    onChange={handleChange}
                    placeholder="Amazon, Local supplier, etc."
                    disabled={loading || successMessage}
                  />
                </div>
                
                <div className="col-12">
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    className={`form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`}
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="2"
                    placeholder="Why this item is needed, alternatives, etc."
                    disabled={loading || successMessage}
                  />
                </div>
              </div>
            </div>
            <div className={`modal-footer ${theme === 'dark' ? 'bg-secondary' : ''}`}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading || successMessage}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Submitting...
                  </>
                ) : successMessage ? (
                  <>
                    <i className="fas fa-check me-2"></i>
                    Success!
                  </>
                ) : (
                  '🛒 Submit Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProcurementRequestModal;