import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserContext, axiosInstance } from '../App';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';

const AttachmentViewer = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { user, theme } = useContext(UserContext);
  const [attachmentData, setAttachmentData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    const loadAttachment = async () => {
      try {
        setLoading(true);
        
        // First get metadata
        const metaResponse = await axiosInstance.get(`/api/tickets/${ticketId}/attachment-meta`);
        
        if (metaResponse.data.success) {
          setMetadata(metaResponse.data.metadata);
          
          // If it's a previewable type, load the content
          if (metaResponse.data.metadata.canPreview) {
            const viewResponse = await axiosInstance.get(`/api/tickets/${ticketId}/attachment-view`);
            if (viewResponse.data.success) {
              setAttachmentData(viewResponse.data);
            }
          }
        }
        
      } catch (error) {
        console.error('Load attachment error:', error);
        setError('Failed to load attachment: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };

    if (ticketId) {
      loadAttachment();
    }
  }, [ticketId]);

  const handleDownload = async () => {
    try {
      const response = await axiosInstance.get(
        `/api/tickets/${ticketId}/attachment`,
        { responseType: 'blob' }
      );
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = metadata?.filename || `ticket-${ticketId}-attachment`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to download: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleClose = () => {
    setShowModal(false);
    navigate(-1);
  };

  const renderAttachmentContent = () => {
    if (!metadata) return null;

    if (loading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading attachment...</span>
          </Spinner>
          <p className="mt-2">Loading attachment...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="danger">
          <h5>Error Loading Attachment</h5>
          <p>{error}</p>
          <Button variant="primary" onClick={handleDownload}>
            Try Download Instead
          </Button>
        </Alert>
      );
    }

    if (metadata.canPreview && attachmentData) {
      switch (metadata.fileType) {
        case 'image':
          return (
            <div className="text-center">
              <img 
                src={attachmentData.data} 
                alt={metadata.filename}
                style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                className="img-fluid"
              />
            </div>
          );
        case 'pdf':
          return (
            <div style={{ height: '70vh' }}>
              <iframe 
                src={attachmentData.data}
                title={metadata.filename}
                width="100%"
                height="100%"
                style={{ border: 'none' }}
              />
            </div>
          );
        default:
          return (
            <Alert variant="info">
              <p>This file type cannot be previewed in the browser.</p>
              <Button variant="primary" onClick={handleDownload}>
                Download File
              </Button>
            </Alert>
          );
      }
    } else {
      return (
        <Alert variant="info">
          <p>This file type cannot be previewed in the browser.</p>
          <Button variant="primary" onClick={handleDownload}>
            Download File
          </Button>
        </Alert>
      );
    }
  };

  return (
    <Modal show={showModal} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className={theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}>
        <Modal.Title>
          <i className="fas fa-paperclip me-2"></i>
          Attachment: {metadata?.filename || 'Loading...'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={theme === 'dark' ? 'bg-dark text-light' : 'bg-light'} style={{ minHeight: '400px' }}>
        {renderAttachmentContent()}
      </Modal.Body>
      <Modal.Footer className={theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}>
        <div className="d-flex justify-content-between w-100">
          <div>
            {metadata && (
              <small className="text-muted">
                File type: {metadata.fileType} • Size: {(metadata.fileSize / 1024).toFixed(2)} KB
              </small>
            )}
          </div>
          <div>
            <Button variant="secondary" onClick={handleClose} className="me-2">
              Close
            </Button>
            <Button variant="primary" onClick={handleDownload}>
              <i className="fas fa-download me-1"></i>
              Download
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default AttachmentViewer;