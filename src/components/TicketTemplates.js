import React, { useState, useContext } from 'react';
import { UserContext, axiosInstance } from '../App';

const TicketTemplates = ({ onTemplateSelect }) => {
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const { theme } = useContext(UserContext);

  // Pre-defined templates (in real app, fetch from backend)
  const defaultTemplates = [
    {
      id: 1,
      name: 'Password Reset Request',
      issue_type: 'Account',
      description: 'I am unable to access my account and need to reset my password. I have tried using the "Forgot Password" feature but did not receive the reset email.',
      priority: 'High',
      tags: ['password', 'login', 'account']
    },
    {
      id: 2,
      name: 'Prinder Not Working',
      issue_type: 'Hardware',
      description: 'The office printer is not responding. When I try to print, the job gets stuck in the queue and the printer shows an error light. I have checked the connections and restarted the printer.',
      priority: 'Medium',
      tags: ['printer', 'hardware', 'printing']
    },
    {
      id: 3,
      name: 'Software Installation',
      issue_type: 'Software',
      description: 'I need to install [Software Name] for my work. Please provide access to the software and installation instructions. I require administrative privileges for the installation.',
      priority: 'Medium',
      tags: ['software', 'installation', 'access']
    },
    {
      id: 4,
      name: 'Email Configuration',
      issue_type: 'Software',
      description: 'I am having trouble setting up my email client. I need assistance with the correct server settings and configuration for both sending and receiving emails.',
      priority: 'High',
      tags: ['email', 'configuration', 'outlook']
    },
    {
      id: 5,
      name: 'Network Connectivity',
      issue_type: 'Network',
      description: 'I am experiencing intermittent network connectivity issues. The internet connection drops frequently, making it difficult to access online resources and cloud services.',
      priority: 'High',
      tags: ['network', 'internet', 'wifi']
    },
    {
      id: 6,
      name: 'VPN Access',
      issue_type: 'Network',
      description: 'I am unable to connect to the company VPN from home. The connection fails with error messages. I need VPN access to reach internal resources.',
      priority: 'High',
      tags: ['vpn', 'remote', 'access']
    }
  ];

  const handleTemplateSelect = (template) => {
    onTemplateSelect?.(template);
    setShowTemplates(false);
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      'High': 'danger',
      'Medium': 'warning',
      'Low': 'success'
    };
    return `bg-${colors[priority]} text-white`;
  };

  return (
    <div className="position-relative">
      {/* Templates Trigger Button */}
      <button
        className="btn btn-outline-info btn-sm"
        onClick={() => setShowTemplates(!showTemplates)}
      >
        <i className="fas fa-magic me-1"></i>
        Use Template
      </button>

      {/* Templates Dropdown */}
      {showTemplates && (
        <div 
          className={`position-absolute top-100 start-0 mt-1 z-3 ${
            theme === 'dark' ? 'bg-dark text-light' : 'bg-light'
          } border rounded shadow-lg`}
          style={{ width: '400px', maxHeight: '500px', overflowY: 'auto' }}
        >
          <div className="p-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <i className="fas fa-clone me-2 text-primary"></i>
                Quick Templates
              </h6>
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setShowTemplates(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <small className="text-muted">Select a template to quickly fill the form</small>
          </div>

          <div className="p-2">
            {defaultTemplates.map((template) => (
              <div
                key={template.id}
                className={`template-item p-3 mb-2 rounded cursor-pointer ${
                  theme === 'dark' ? 'bg-secondary hover-bg-dark' : 'bg-light hover-bg-white border'
                }`}
                onClick={() => handleTemplateSelect(template)}
                style={{ transition: 'all 0.2s ease' }}
              >
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <h6 className="mb-0 text-primary">{template.name}</h6>
                  <span className={`badge ${getPriorityBadge(template.priority)}`}>
                    {template.priority}
                  </span>
                </div>
                <p className="small text-muted mb-2">
                  {template.description.substring(0, 100)}...
                </p>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="badge bg-light text-dark">
                    <i className="fas fa-tag me-1"></i>
                    {template.issue_type}
                  </span>
                  <div>
                    {template.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="badge bg-outline-secondary me-1">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 border-top text-center">
            <small className="text-muted">
              <i className="fas fa-lightbulb me-1"></i>
              Templates help you submit tickets faster with pre-filled common issues
            </small>
          </div>
        </div>
      )}

      {/* Overlay to close when clicking outside */}
      {showTemplates && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 z-2"
          onClick={() => setShowTemplates(false)}
          style={{ background: 'transparent' }}
        />
      )}
    </div>
  );
};

export default TicketTemplates;